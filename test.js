const ImgurAPI = require('./build/index.js').default


const imgur = new ImgurAPI();

imgur.setCredentials({
	client_id: 'ae947e242e0466f',
	client_secret: 'cc29b41ed43e1208a9aa8a7a9b5ae74bfbb58b25'
})

// imgur.image.upload('/users/federicovitale/desktop/img.jpg').then(console.log).catch(console.error)
// imgur.image.get('SpG9pPD').then(console.log).catch(console.error)
imgur.image.delete('hkdVJgfrlqGuzbX').then(console.log).catch(console.error);