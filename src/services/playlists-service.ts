import uuidv4 from 'uuid/v4';

import StorageService from './storage-service';

export default class PlaylistsService {
  static async getList(updateCache?: boolean): Promise<any> {
    let list = [];
    const errorsList = [];
    try {
      const rawList = await StorageService.getItem(
        'playlists.json',
        updateCache
      );
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

  static async create(name: string) {
    const listResponse = await PlaylistsService.getList(true);
    let playlists = listResponse.albums;
    if (
      (!playlists || playlists == null) &&
      listResponse.errorsList.length === 0
    ) {
      playlists = [];
    }

    const errorsList = [];
    const playlistId = uuidv4();
    const metadata = {
      id: playlistId,
      name,
      createdDate: new Date(),
      thumbnailId: null
    };
    try {
      await StorageService.setItem(playlistId, '[]');

      playlists.unshift(metadata);
    } catch (error) {
      errorsList.push({
        id: playlistId,
        errorCode: 'err_failed'
      });
    }

    await StorageService.setItem('playlists.json', JSON.stringify(playlists));
    return { list: playlists, errorsList };
  }

  static async updateName(id: string, name: string): Promise<any> {
    // id and metadata is required
    if (!id || !name) {
      return false;
    }
    const listResponse = await PlaylistsService.getList(true);
    const playlists = listResponse.list;
    let isFound = false;
    let index = 0;
    for (const item of playlists) {
      // Current album
      if (item.id === id) {
        playlists[index].name = name;
        isFound = true;
        break;
      }
      index++;
    }

    // Don't update if playlist don't exist
    if (!isFound) {
      return false;
    }

    await StorageService.setItem('playlists.json', JSON.stringify(playlists));

    return playlists;
  }

  static async updateThumbnail(id: string, thumbnailId: string): Promise<any> {
    // id and metadata is required
    if (!id || !thumbnailId) {
      return false;
    }
    const listResponse = await PlaylistsService.getList(true);
    const playlists = listResponse.albums;
    let isFound = false;
    let index = 0;
    for (const item of playlists) {
      // Current album
      if (item.id === id) {
        playlists[index].thumbnailId = thumbnailId;
        isFound = true;
        break;
      }
      index++;
    }

    // Don't update if album don't exist
    if (!isFound) {
      return false;
    }

    await StorageService.setItem('playlists.json', JSON.stringify(playlists));

    return playlists;
  }

  static async delete(id: string): Promise<any> {
    let returnState = false;
    try {
      // Put empty file, since deleteFile is yet not supported
      await StorageService.setItem(id, '');
      // TODO: add back when available.
      // await deleteFile(albumId);
      returnState = true;
    } catch (error) {
      returnState = false;
    }

    if (!returnState) {
      return false;
    }

    const listResponse = await PlaylistsService.getList(true);
    const playlists = listResponse.list;

    let index = 0;
    for (const item of playlists) {
      if (id === item.id) {
        playlists.splice(index, 1);
        await StorageService.setItem(
          'playlists.json',
          JSON.stringify(playlists)
        );
        return playlists;
      }
      index++;
    }
    return false;
  }

  static async getMetadata(id: string): Promise<any> {
    let response = {};
    const listResponse = await PlaylistsService.getList();
    const playlists = listResponse.list;

    let index = 0;
    for (const item of playlists) {
      // Current album
      if (item.id === id) {
        response = playlists[index];
        break;
      }
      index++;
    }

    return response;
  }
}
