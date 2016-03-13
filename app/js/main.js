var flickr = new Flickr({
  api_key: "b61f22692d6e68e3ba74fa94df895a3c"
});

function debounce(func, wait, immediate) {
	var timeout;
	return function() {
		var context = this, args = arguments;
		var later = function() {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		var callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	};
};

var app  = {
	startpoint: 0,
	endpoint: 50,
	photos: [],
	lock: false,
	page: 0,
	limit: 0, 
	focusId: 0,
	mwBlock: false,

	init: function (params) {
		Object.assign(this, params);
		this.isChrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;

		this.getPhotos(this.renderPhotos.bind(this));
		
		this.on('keydown', '.img-a', this.onKeyDown.bind(this));
		this.on('mousewheel', this , this.onScroll.bind(this));

		return this;
	},

	onScroll: function (e) {
		var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
	
		if (delta == 0 || this.mwBlock) {
			return false;
		}
		
		this.mwBlock = true;

		if (delta == -1) {
			this.setFocus(this.focusId, 5);
		} else {
			this.setFocus(this.focusId, -5);
		}
		
		debounce(function () {
			this.mwBlock = false;
		}.bind(this), 600)();

		return false;
	},

	onKeyDown: function (e) {
		var id = e.target.dataset.id;

		switch(e.keyCode) {
			case 40: // bottom
				e.preventDefault();
				this.setFocus(id, 5);
			break;
			case 9:
			case 39: // right
				e.preventDefault();
				this.setFocus(id, 1);
			break;
			case 38: // top
				e.preventDefault();
				this.setFocus(id, -5);
			break;
			case 37: // left
				e.preventDefault();
				this.setFocus(id, -1);
			break;			
		}
	},

	setFocus: function (id, step) {
		var fid = +id + step;
		var selector = document.querySelector('.img-a[data-id="'+fid+'"]');
		selector && selector.focus();
		
		if (selector)  { this.focusId = fid; }
		
		if (!this.lock && fid > this.endpoint - 10) {
			this.appendload();
		} 

		if (!this.lock && this.page > 1 && fid < this.startpoint) {
			this.prependLoad();
		}
	},

	prependLoad: function () {
		this.lock = true;
		this.page -= 1;
		this.limit = 40;
		this.loading(false);

		this.getPhotos(function () {
			this.startpoint -= this.limit;
			this.endpoint  -= this.limit;
			this.renderPhotos();
		}.bind(this));
	},

	appendload: function () {
		this.lock = true;
		this.page += 1;
		this.limit = 40;
		this.loading(true);

		this.getPhotos(function () {
			this.startpoint += this.limit;
			this.endpoint  += this.limit;
			this.renderPhotos();
		}.bind(this));
	},


	getPhotos: function (callback) {
		flickr.photos.search({
		  	text: "red+panda",
		  	page: this.page,
		  	per_page: this.limit
		}, function(err, result) {
		  	if(err) { throw new Error(err); }
		  	this.photos = this.photos.concat(result.photos.photo);
		  	callback();
		}.bind(this));
	},

	renderPhotos: function () {
		var photos = this.photos, 
			photo,
			url, 
			nodes = '',
			startpoint = this.startpoint,
			endpoint = this.endpoint > photos.length ? photos.length : this.endpoint;

		for (var i = startpoint; i < endpoint; i++) {
	      	photo = photos[i];
			url = "http://farm" + photo.farm + ".static.flickr.com/" + photo.server + "/" + photo.id + "_" + photo.secret + "_" + "n.jpg";

	      	nodes +='<div class="img-wrap">' +
				'<a href="#" class="img-a" data-id="'+i+'">'+ 
					'<img src="'+url+'" alt="">' + 
				'</a>' +
			'</div>'; 	
	    }

	    this.container.innerHTML = nodes;
	    
	    var imgA = document.querySelector('.img-a[data-id="'+this.focusId+'"]') || document.querySelector('.img-a');
	    imgA && imgA.focus();
		
		this.lock = false;
	},

	on: function (event, selector, callback) {
		
		this.container.addEventListener(event, function(e) {
			if (selector == this) {
				callback(e);
			}  else {
				if (e.target && e.target.matches(selector)) {
			    	callback(e);
				}
			} 
		}.bind(this));
	},

	/*
	 * type: 0 - prepend, 1 -apend;	
	 */
	loading: function (type) {
		var loading = document.createElement('div');
		
		loading.className = 'loading';
		loading.innerHTML = 'Loading...';

		if (type) {
			this.container.appendChild(loading);
		} else {
			this.container.insertBefore(loading, this.container.firstChild);
		}
	}

}.init({
	page: 1,
	limit: 50,
	container: document.querySelector('.img-container')
});
