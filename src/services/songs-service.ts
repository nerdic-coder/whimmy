import StorageService from './storage-service';
import PlaylistsService from './playlists-service';

export default class SongsService {
  static async getList(
    updateCache?: boolean,
    playlistId?: string
  ): Promise<any> {
    let list = [];
    const errorsList = [];
    try {
      const rawList = playlistId
        ? await StorageService.getItem(playlistId, updateCache)
        : await StorageService.getItem('music-library.json', updateCache);

      if (rawList) {
        list = JSON.parse(rawList);
      } else {
        errorsList.push('err_list');
      }
    } catch (error) {
      errorsList.push('err_list');
    }

    return {
      list,
      errorsList
    };
  }

  static async get(metadata: PhotoMetadata): Promise<any> {
    return StorageService.getItem(metadata.id);
  }

  static async upload(
    metadata: PhotoMetadata,
    data: any,
    playlistId?: string,
    thumbnailData?: any
  ): Promise<any> {
    const listResponse = await SongsService.getList(true);
    let list = listResponse.list;
    if ((!list || list == null) && listResponse.errorsList.length === 0) {
      list = [];
    }

    let playlist = [];
    if (playlistId) {
      const playlistsResponse = await SongsService.getList(true, playlistId);
      playlist = playlistsResponse.list;
      if (
        (!playlist || playlist == null) &&
        playlistsResponse.errorsList.length === 0
      ) {
        playlist = [];
      }
    }

    const errorsList = [];
    const listdata = {
      id: metadata.id,
      filename: metadata.filename
    };

    try {
      // Save raw data to a file
      await StorageService.setItem(metadata.id, data);
      if (thumbnailData) {
        await StorageService.setItem(metadata.id + '-thumbnail', thumbnailData);
      }

      // Save photos metadata to a file
      await StorageService.setItem(
        metadata.id + '-meta',
        JSON.stringify(metadata)
      );

      list.unshift(listdata);
      if (playlistId) {
        await PlaylistsService.updateThumbnail(playlistId, metadata.id);

        playlist.unshift(listdata);
      }
    } catch (error) {
      const fileSizeInMegabytes = metadata.stats.size / 1000000;
      if (fileSizeInMegabytes >= 5) {
        errorsList.push({
          id: metadata.filename,
          errorCode: 'err_filesize'
        });
      } else {
        errorsList.push({
          id: metadata.filename,
          errorCode: 'err_failed'
        });
      }
    }

    await StorageService.setItem('music-library.json', JSON.stringify(list));

    if (playlistId) {
      await StorageService.setItem(playlistId, JSON.stringify(playlist));
    }

    return { list, errorsList };
  }

  static async addToPlaylist(
    playlistId: string,
    ids: string[]
  ): Promise<boolean> {
    if (!ids || ids.length < 1) {
      return false;
    }
    let playlist = [];
    if (playlistId) {
      const playlistsResponse = await SongsService.getList(true, playlistId);
      playlist = playlistsResponse.list;
      if (
        (!playlist || playlist == null) &&
        playlistsResponse.errorsList.length === 0
      ) {
        playlist = [];
      }
    }
    for (const id of ids) {
      const metadata = await SongsService.getMetadata(id);
      if (metadata && !metadata.albums) {
        metadata.albums = [];
      }
      if (metadata && !metadata.albums.includes(playlistId)) {
        playlist.unshift({
          id,
          filename: metadata.filename
        });
        metadata.albums.push(playlistId);
        await SongsService.setMetadata(id, metadata);
      }
    }

    await StorageService.setItem(playlistId, JSON.stringify(playlist));

    await PlaylistsService.updateThumbnail(playlistId, ids[0]);

    return true;
  }

  static async delete(id: string): Promise<boolean> {
    let returnState = false;
    const metadata = await SongsService.getMetadata(id);
    try {
      // Delete photo, compressed photos and the photo metadata
      await StorageService.deleteItem(id);
      await StorageService.deleteItem(id + '-meta');
      await StorageService.deleteItem(id + '-thumbnail');
      await StorageService.deleteItem(id + '-viewer');
      returnState = true;
    } catch (error) {
      returnState = false;
    }

    if (!returnState) {
      return false;
    }

    // Remove item from main list
    returnState = await SongsService.removeItemFromList(id);

    // Remove item from playlists
    if (metadata.albums && metadata.albums.length > 0) {
      for (const albumId of metadata.albums) {
        returnState = await SongsService.removeItemFromList(id, albumId);
        if (!returnState) {
          return false;
        }
      }
    }
    return returnState;
  }

  static async removeItemFromList(
    id: string,
    playlistId?: string
  ): Promise<boolean> {
    const listResponse = await SongsService.getList(true, playlistId);
    const list = listResponse.list;
    const listName = playlistId ? playlistId : 'music-library.json';

    let index = 0;
    for (const item of list) {
      if (id === item.id) {
        list.splice(index, 1);
        await StorageService.setItem(listName, JSON.stringify(list));

        if (list.length > 0) {
          await PlaylistsService.updateThumbnail(playlistId, list[0].id);
        }
        break;
      }
      index++;
    }

    const metadata: PhotoMetadata = await SongsService.getMetadata(id);
    if (metadata) {
      metadata.albums = metadata.albums.includes(playlistId)
        ? metadata.albums.filter(album => album !== playlistId)
        : metadata.albums;
      await SongsService.setMetadata(id, metadata);
    }

    return true;
  }

  static async deleteItems(ids: string[]): Promise<boolean> {
    let returnState = false;
    try {
      for (const id of ids) {
        const result = await SongsService.delete(id);
        if (!result) {
          throw result;
        }
      }
      returnState = true;
    } catch (error) {
      console.error(error);
      returnState = false;
    }

    return returnState;
  }

  static async removeFromList(
    ids: string[],
    playlistId?: string
  ): Promise<boolean> {
    let returnState = false;
    try {
      for (const id of ids) {
        const result = await SongsService.removeItemFromList(id, playlistId);
        if (!result) {
          throw result;
        }
      }
      returnState = true;
    } catch (error) {
      returnState = false;
    }

    return returnState;
  }

  static async getNextAndPreviousItem(
    id: string,
    playlistId?: string
  ): Promise<any> {
    const response = { previousId: null, nextId: null };
    const listResponse = await SongsService.getList(true, playlistId);
    const list = listResponse.list;

    let index = 0;
    for (const item of list) {
      // Current photo
      if (item.id === id) {
        if (list[index - 1]) {
          response.previousId = list[index - 1].id;
        }
        if (list[index + 1]) {
          response.nextId = list[index + 1].id;
        }
        break;
      }
      index++;
    }

    return response;
  }

  static async getMetadata(id: string): Promise<PhotoMetadata> {
    const metadata: string = await StorageService.getItem(id + '-meta');

    if (!metadata) {
      const listResponse = await SongsService.getList();
      const list = listResponse.list;
      let newMetadata: PhotoMetadata;
      let index = 0;
      for (const item of list) {
        // Current item
        if (item.id === id) {
          newMetadata = list[index];
          SongsService.setMetadata(id, metadata);
          break;
        }
        index++;
      }
      return newMetadata;
    } else if (metadata) {
      return JSON.parse(metadata);
    } else {
      return null;
    }
  }

  static async setMetadata(id: string, metadata: any): Promise<boolean> {
    // id and metadata is required
    if (!id || !metadata) {
      return false;
    }

    // Save photos metadata to a file
    await StorageService.setItem(id + '-meta', JSON.stringify(metadata));

    return true;
  }
}
