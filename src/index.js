import path from 'path';
import fs from 'fs';
import { 
	URL
} from 'url';

import ow from 'ow';
import got from 'got';
import normalize from 'normalize-url';

export default class ImgurAPI {
	client_id = undefined;
	client_secret = undefined;

	_genHeaders = ({
		forceAnonymus = false,
		forceAuth = false
	}) => {
		if (!this.tkn && forceAuth) {
			throw new Error('Access Token required for this action!');
		}

		if (this.tkn && forceAnonymus === false || this.tkn && forceAuth === true) {
			return {
				'Authorization': `Bearer ${this.tkn}`
			}
		}

		return {
			'Authorization': `Client-ID ${this.client_id}`
		}
	}

	_makeURL = (endpoint = '/', params = {}) => {
		ow(endpoint, ow.string.notEmpty());
		ow(params, ow.object);

		const url = new URL('https://api.imgur.com/3/')

		url.pathname += endpoint;

		for (let i = 0; i < Object.keys(params).length; i++) {
			url.searchParams.set(key, params[key])
		}

		return normalize(url.href);
	}

	_tryParse = data => {
		if (typeof data !== 'string') return data;

		try {
			return JSON.parse(data);
		} catch (e) {
			return data;
		}
	}

	_readFile = file => new Promise((resolve, reject) => {
		ow(file, ow.string.notEmpty())

		fs.readFile(file, (error, data) => {
			if (error) reject(error);
			resolve(data);
		})
	})



	/**
	 * @param {Object} options
	 * @param {String} options.client_id Set the Client ID
	 * @param {String} options.client_secret Set the Client Secret
	 */
	setCredentials = ({
		client_id,
		client_secret,
		token
	} = {}) => {
		ow(client_secret, ow.string);
		ow(client_id, ow.string);

		if (!client_secret && !client_id) {
			return new SyntaxError('Invalid client_id/client_secret!')
		}

		this.client_id = client_id;
		this.client_secret = client_secret;

		if (token) {
			ow(token, ow.string);

			this.tkn = token;
		}
	}

	// TODO: Test login with token
	token = {
		generate: () => {
			return this._makeURL('oauth2/authorize', {
				client_id: this.client_id,
				response_type: 'token'
			})
		},

		refresh: refresh_token => {
			ow(refresh_token, ow.string.notEmpty());

			const url = this._makeURL('oauth2/token', {
				client_id: this.client_id,
				client_secret: this.client_secret,
				grant_type: 'refresh_token',
				refresh_token,
			});

			const {
				body
			} = got.get(url, {
				headers: this._genHeaders({ 
					forceAuth: true
				})
			})

			return this._tryParse(body);
		}
	}

	comment = {
		get: async comment_id => {
			const url = this._makeURL(`/comment/${comment_id}`);
			const {
				body
			}  = await got.get(url, {
				headers: this._genHeaders(true)
			})

			return this._tryParse(body);
		},

		create: async (comment, {
			image_id,
			parent_id
		}) => {
			ow(comment, ow.string.notEmpty());
			ow(image_id, ow.string.notEmpty());

			if (parent_id) {
				ow(parent_id, ow.string);
			}

			const url = this._makeURL(`/comment`);
			const { 
				body
			} = await got.post(url, {
				json: true,
				body: {
					image_id,
					parent_id,
					comment,
				},
				headers: this._genHeaders({
					forceAuth: true
				})
			})

			return this._tryParse(body);
		},

		delete: async comment_id => {
			ow(comment_id, ow.string.notEmpty());

			const url = this._makeURL(`/comment/${comment_id}`);
			const { 
				body
			} = await got.delete(url, {
				json: true,
				headers: this._genHeaders({
					forceAuth: true
				})
			})

			return this._tryParse(body);
		},

		vote: async (comment_id, vote = 'up') => {
			ow(comment_id, ow.string.notEmpty());
			ow(vote, ow.string.notEmpty());

			switch (vote.toLowerCase()) {
				case 'up':
				case true:
					vote = 'up';
					break;
				case 'down':
				case false:
					vote = 'down';
					break;
				case 'veto':
				case 0:
					vote = 'veto';
			}

			const url = this._makeURL(`/comment/${comment_id}/vote/${vote}`);

			const { 
				body
			} = await got.post(url, {
				json: true,
				headers: this._genHeaders({
					forceAuth: true
				})
			})

			return this._tryParse(body);
		},

		report: async (comment_id, {
			reason
		}) => {
			ow(comment_id, ow.string.notEmpty());

			const url = this._makeURL(`/comment/${comment_id}/report`);
			const {
				body
			}  = got.post(url, {
				json: true,
				body: {
					reason
				},
				headers: this._genHeaders({
					forceAuth: true
				})
			})

			return this._tryParse(body);
		},

		reply: {
			create: async (comment_id, {
				image_id,
				comment
			}) => {
				ow(comment_id, ow.string.notEmpty());
				ow(image_id, ow.string.notEmpty());
				ow(comment, ow.string.notEmpty());

				const url = this._makeURL(`/comment/${comment_id}`);

				const { 
					body
				} = await got.post(url, {
					body: {
						comment,
						image_id
					},
					headers: this._genHeaders({
						forceAuth: true
					})
				})

				return this._tryParse(body);
			},

			getAll: async comment_id => {
				ow(comment_id, ow.string.notEmpty());

				const url = this._makeURL(`/comment/${comment_id}/replies`);
				const { 
					body
				} = await got.get(url, {
					headers: this._genHeaders({ 
						forceAnonymus: true
					})
				})

				return this._tryParse(body);
			}

		}
	}

	users = {
		find: user => ({
			get: async (username = user) => {},
			getGalleryFavorites: async (username = user) => {},
			getFavorites: async (username = user) => {},
			block: async (username = user) => {},
			isBlocked: async (username = user) => {},
			deleteBlock: async (username = user) => {},
			getSubmissions: async (username = user) => {},

			// un/authed
			getAvatars: async (username = user) => {},
			verifyEmail: async (username = user) => {},
			getGalleryProfile: async (username = user) => {},
			sendVerifyEmail: async (username = user) => {},
			album: (album_hash) => ({
				get: async (album_hash, {username = user}) => {},
				delete: async (username = user) => {},
			}),
			getAlbums: async (username = user) => {},
			getAlbumIds: async (page, {username = user}) => {},
			getAlbumCount: async (username = user) => {},
		})
	}

	account = {
		getMyImages: async () => {},
		getBlocked: async () => {},
		getAvatar: async () => {},
		getSettings: async () => {},
		editSettings: async ({
			bio, public_images,
			messaging_enabled,
			album_privacy, accepted_gallery_items,
			username, show_mature
		}) => {},
	}

	image = {
		get: async hash => {
			const url = this._makeURL(`/image/${hash}`)

			const { 
				body
			} = await got.get(url, {
				headers: this._genHeaders({
					forceAnonymus: true
				})
			})

			return this._tryParse(body)
		},

		upload: async (filepath, {
			album,
			type,
			name,
			title,
			description
		} = {}) => {
			const file = await this._readFile(filepath);
			const url = this._makeURL('/image', {
				title,
				type,
				album,
				description,
				name
			});

			const {
				body
			} = await got.post(url, {
				json: true,
				body: {
					name,
					title,
					description,
					type,
					album,
					image: file.toString('base64')
				},
				headers: this._genHeaders()
			})

			return this._tryParse(body)
		},

		update: async (hash, {
			title,
			description
		} = {}) => {

			if (title) {
				ow(title, ow.string);
			}

			if (description) {
				ow(description, ow.string);
			}

			const url = this._makeURL(`/image/${hash}`);
			const { 
				body
			} = await got.post(url, {
				headers: this._genHeaders({
					forceAuth: true
				}),
				body: {
					title,
					description
				}
			})

			return this._tryParse(body);
		},

		delete: async hash => {
			const url = this._makeURL(`/image/${hash}`);
			const { 
				body
			} = await got.delete(url, {
				headers: this._genHeaders()
			})

			return this._tryParse(body)
		},

		favorite: async hash => {
			const url = this._makeURL(`/image/${hash}/favorite`);
			const { 
				body
			} = await got.post(url, {
				headers: this._genHeaders({ 
					forceAuth: true
				})
			})

			return this._tryParse(body);
		},
	}
}