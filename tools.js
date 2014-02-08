
//A set of handy, game independant classes and functions.
tools = new function() {

    this.randRange = function(minv, maxv) { 
        return Math.random()*(maxv - minv) + minv;
    }
    
    this.randRangeInt = function(minv, maxv) {
    	return Math.floor(this.randRange(minv, maxv+1))
    }

    //The Delta class facilitates the keeping of speeds consistant accross different computers.
    //When a speed is multiplied by Delta.time, the unit of speed becomes pixels per second.
    //You must run Delta.Tick() in your main loop.
    this.Delta = function() {
        var ticks = new Date().getTime();
        this.time = 0;
        this.currenttime;
        this.Tick = function() {
            var t = (new Date().getTime());
            this.currenttime = t;
            this.time = (t - ticks)/1000;
			this.FPS = 1000/(t - ticks);
            ticks = t;
        }
    };
    
    //Image loader class. Loads all images in a list of filenames using path + list_item + extension.
    //Runs the provided callback function when complete.
    this.ImageLoader = function() {
        var i;
        var num_loaded = 0;
        var t = this;
        this.loaded = false;
		
		this.Load = function(path, list, extension, callback)
		{
			for (i in list) {
				var img =  new Image();
				img.src = path+list[i]+extension;
				t[list[i]] = img;
				img.onload = function() {
					num_loaded++;
					if (num_loaded === list.length) {
						t.loaded = true;
						if (callback) {
							callback();
						}
					}
				};
			}
		}
    };
	
	//Adds an event listener for type which calls the callback with the
	//coordinates relative to the given element.
	this.addMouseListener = function(element, listener, type, callback) {
		var gpos = this.getRelativeMousePos;
		if (listener===undefined) {listener = element;}
		listener.addEventListener(type, function(e) {
			callback(e, gpos(e, element));
		}, false);
	}
    
	//Given a mouse event, find the mouse position relative to an element.
	this.getRelativeMousePos = function(e, element) {
		var x;
		var y;
		if (e.pageX || e.pageY) { 
		  x = e.pageX;
		  y = e.pageY;
		}
		else { 
		  x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft; 
		  y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop; 
		} 
		x -= element.offsetLeft;
		y -= element.offsetTop;
		return {x: x, y:y};
	}
	
    //Key manager class.
    //Keys.down[char] to check if a key is held.
    //Keys.hit[char] to check if a key was 'pressed' (by the browser's keydown event). 
    this.Keys = new (function() {
        this.hit = {};
        this.down = {};

        this.Space = 32;
    
        var that = this;
        
        this.Init = function() {
            window.addEventListener('keydown', function(evt) {
                that.hit[evt.keyCode] = true;
                that.down[evt.keyCode] = true;
            }, true);
            window.addEventListener('keyup', function(evt) {
                that.down[evt.keyCode] = false;
            }, true);            
        };


        this.Tick = function() {
            this.hit = {};
        };
    })();    
    
    //The Allocator is an Array which allocates new objects to the first available free ID. 
    this.Allocator = function() {
        var freeIDs = Array();
        var counter = 0;
        var removals = {};
        var that = this;
        this.objects = Array();
        
        
        /*
        Add a new object to the allocator, return its id.
        */
        this.Allocate = function(object) {
            var id;
            if (freeIDs.length !== 0) {
                id = freeIDs.pop();
            }
            else {
                id = counter;
                counter++;
            }
            this.objects[id] = object;
            
            return id;
        }
        /*
        Get the object associated with the given id.
        */
        this.Get = function(id) {
            return this.objects[id];
        }
        
        /*
        Queues the object for removal
        */
        this.Remove = function(id) {
            removals[id] = true;
        }
        
        var _removeid = function(id) {
            var obj = that.Get(id)
            if (obj === undefined) {
                console.error("Attempt to remove non-existant object at index "+id);
                return;
            }
            
            if (id === that.objects.length) {
                that.objects.pop();
            }
            that.objects[id] = undefined;
            freeIDs.push(id);
            return obj;
        }
        var _doremovals = function() {
            for (var i in removals) {
                _removeid(i);
            }
            removals = {};
        }
        
        /* 
        Enumerate all objects in the allocator
        Calls callback(object, id) for every object.
        */
        this.Enumerate = function(callback) {
            var i;
            for (i = 0; i < this.objects.length; i+=1) {
                if (this.objects[i] !== undefined) {
                    callback(this.objects[i], i);
                }
            }
            _doremovals();
        }
        
        /* Enumerate through all possible pairs of objects
        Calls callback(obj1, obj2) for every possible pair. 
        */
        this.EnumPairs = function(callback) {
            var i, j;
            for (i = 0; i < this.objects.length; i+=1) {
                if (this.objects[i] !== undefined) {
                    for (j = i+1; j < this.objects.length;j+=1) {
                        if (this.objects[j] !== undefined) {
                            callback(this.objects[i], this.objects[j]);
                        }
                    }
                }
            }
            _doremovals();
        }
    }    

    //Runs 'func' every 'delay' milliseconds exactly 'count' times.
    //Returns the interval Id.
    this.spawner = function(count, delay, func, finishfunc) {
        var id = setInterval(function() {
            func();
            count--;
            if (count === 0) {
            	clearInterval(id);
            	if (finishfunc) finishfunc();	
            }
        }, delay);
        return id;
    }
    
    //Runs 'func' every 'delay' milliseconds for time milliseconds.
    //Returns the interval Id.
    this.emitter = function(time, delay, func, finishfunc) {
        var id = setInterval(function() {
            func();
        }, delay);
        if (time > 0) {
            setTimeout(function() {
                clearInterval(id);
                if (finishfunc) finishfunc();
            }, time);
        }
        return id;
    }
          
}();
