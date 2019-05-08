import StorageService from './storage-service';
import AlbumsService from './albums-service';

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
        await AlbumsService.updateAlbumThumbnail(playlistId, metadata.id);

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
      const metadata = await SongsService.getPhotoMetaData(id);
      if (metadata && !metadata.albums) {
        metadata.albums = [];
      }
      if (metadata && !metadata.albums.includes(playlistId)) {
        playlist.unshift({
          id,
          filename: metadata.filename
        });
        metadata.albums.push(playlistId);
        await SongsService.setPhotoMetaData(id, metadata);
      }
    }

    await StorageService.setItem(playlistId, JSON.stringify(playlist));

    await AlbumsService.updateAlbumThumbnail(playlistId, ids[0]);

    return true;
  }

  static async deletePhoto(photoId: string): Promise<boolean> {
    let returnState = false;
    const metadata = await SongsService.getPhotoMetaData(photoId);
    try {
      // Delete photo, compressed photos and the photo metadata
      await StorageService.deleteItem(photoId);
      await StorageService.deleteItem(photoId + '-meta');
      await StorageService.deleteItem(photoId + '-thumbnail');
      await StorageService.deleteItem(photoId + '-viewer');
      returnState = true;
    } catch (error) {
      returnState = false;
    }

    if (!returnState) {
      return false;
    }

    // Remove photo from main list
    returnState = await SongsService.removePhotoFromList(photoId);

    // Remove photo from albums
    if (metadata.albums && metadata.albums.length > 0) {
      for (const albumId of metadata.albums) {
        returnState = await SongsService.removePhotoFromList(photoId, albumId);
        if (!returnState) {
          return false;
        }
      }
    }
    return returnState;
  }

  static async removePhotoFromList(
    photoId: string,
    albumId?: string
  ): Promise<boolean> {
    const listResponse = await SongsService.getList(true, albumId);
    const list = listResponse.list;
    const listName = albumId ? albumId : 'music-library.json';

    let index = 0;
    for (const photo of list) {
      if (photoId === photo.id) {
        list.splice(index, 1);
        await StorageService.setItem(listName, JSON.stringify(list));

        if (list.length > 0) {
          await AlbumsService.updateAlbumThumbnail(albumId, list[0].id);
        }
        break;
      }
      index++;
    }

    const metadata: PhotoMetadata = await SongsService.getPhotoMetaData(
      photoId
    );
    if (metadata) {
      metadata.albums = metadata.albums.includes(albumId)
        ? metadata.albums.filter(album => album !== albumId)
        : metadata.albums;
      await SongsService.setPhotoMetaData(photoId, metadata);
    }

    return true;
  }

  static async deletePhotos(photoIds: string[]): Promise<boolean> {
    let returnState = false;
    try {
      for (const photoId of photoIds) {
        const result = await SongsService.deletePhoto(photoId);
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

  static async removePhotosFromList(
    photoIds: string[],
    albumId?: string
  ): Promise<boolean> {
    let returnState = false;
    try {
      for (const photoId of photoIds) {
        const result = await SongsService.removePhotoFromList(photoId, albumId);
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

  static async getNextAndPreviousPhoto(
    id: string,
    albumId?: string
  ): Promise<any> {
    const response = { previousId: null, nextId: null };
    const listResponse = await SongsService.getList(true, albumId);
    const list = listResponse.list;

    let index = 0;
    for (const photo of list) {
      // Current photo
      if (photo.id === id) {
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

  static async getPhotoMetaData(photoId: string): Promise<PhotoMetadata> {
    const cachedPhotoMetaData: string = await StorageService.getItem(
      photoId + '-meta'
    );

    if (!cachedPhotoMetaData) {
      const listResponse = await SongsService.getList();
      const list = listResponse.list;
      let photoMetaData: PhotoMetadata;
      let index = 0;
      for (const photo of list) {
        // Current photo
        if (photo.id === photoId) {
          photoMetaData = list[index];
          SongsService.setPhotoMetaData(photoId, cachedPhotoMetaData);
          break;
        }
        index++;
      }
      return photoMetaData;
    } else if (cachedPhotoMetaData) {
      return JSON.parse(cachedPhotoMetaData);
    } else {
      return null;
    }
  }

  static async setPhotoMetaData(
    photoId: string,
    metadata: any
  ): Promise<boolean> {
    // id and metadata is required
    if (!photoId || !metadata) {
      return false;
    }

    // Save photos metadata to a file
    await StorageService.setItem(photoId + '-meta', JSON.stringify(metadata));

    return true;
  }
}
