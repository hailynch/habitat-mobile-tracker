
// custom label function

google.maps.Label = function(opt_options) {
    // init default values
    this.set('visible', true);
    this.set('opacity', 1);
    this.set('clickable', false);
    this.set('strokeColor', "#00F");
    this.set('text', "");
    this.set('textOnly', false); // true only text, false text within a box

    this.setValues(opt_options);

    var span = this.span_ = document.createElement('span');
    span.style.cssText = 'position: relative; left: -50%;' +
    'white-space: nowrap; color: #000;-moz-user-select:none;-webkit-user-select:none;-ms-user-select:none;-khtml-user-select:none;';

    span.style.cssText += !this.get('textOnly') ?
        'border: 1px solid '+this.get('strokeColor')+'; border-radius: 5px; ' +
        'top:-12px;font-size:9px;padding: 2px; background-color: white'
        :
        'top:-8px;font-size:12px;font-weight: bold; text-shadow: 2px 0 0 #fff, -2px 0 0 #fff, 0 2px 0 #fff, 0 -2px 0 #fff, 1px 1px #fff, -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff;'
        ;

    var div = this.div_ = document.createElement('div');
    div.appendChild(span);
    div.style.cssText = 'position: absolute; display: none;-moz-user-select:none;-webkit-user-select:none;-ms-user-select:none;-khtml-user-select:none;';
};

google.maps.Label.prototype = new google.maps.OverlayView();


// Implement onAdd
google.maps.Label.prototype.onAdd = function() {
  var pane = this.getPanes().overlayImage;
  pane.appendChild(this.div_);

  // redraw if any option is changed
  var ctx = this;
  var callback = function() { ctx.draw(); };
  this.listeners_ = [
    google.maps.event.addListener(this, 'opacity_changed', callback),
    google.maps.event.addListener(this, 'position_changed', callback),
    google.maps.event.addListener(this, 'visible_changed', callback),
    google.maps.event.addListener(this, 'clickable_changed', callback),
    google.maps.event.addListener(this, 'text_changed', callback),
    google.maps.event.addListener(this, 'zindex_changed', callback),
    google.maps.event.addDomListener(this.div_, 'click', function() {
      if (ctx.get('clickable')) {
        google.maps.event.trigger(ctx, 'click');
      }
    })
  ];
};


// Implement onRemove
google.maps.Label.prototype.onRemove = function() {
  this.div_.parentNode.removeChild(this.div_);

  // remove all listeners
  for (var i = 0, j = this.listeners_.length; i < j; i++) {
    google.maps.event.removeListener(this.listeners_[i]);
  }
};


// Implement draw
google.maps.Label.prototype.draw = function() {
  var projection = this.getProjection();
  var position = projection.fromLatLngToDivPixel(this.get('position'));

  var div = this.div_;
  if(position !== null) {
      div.style.left = position.x + 'px';
      div.style.top = position.y + 'px';
  }

  div.style.display = this.get('visible') && this.get('opacity') >= 0.6 ? 'block' : 'none';
  this.span_.style.cursor = this.get('clickable') ? 'pointer' : '';
  div.style.zIndex = this.get('zIndex');
  this.span_.innerHTML = this.get('text').toString();
};


// custom dropdown menu control

google.maps.DropDownControl = function(options) {
    var ctx = this;
    this.options = options;

    // generate the controls
    this.div_ = document.createElement('div');
    this.div_.className = "gmnoprint";
    this.div_.draggable = false;
    this.div_.style.cssText = "margin: 5px; margin-top: 0;z-index: 0; position: absolute; cursor: pointer; text-align: left; width: 100px; right: 0px; top: 0px;-moz-user-select:none;-webkit-user-select:none;-ms-user-select:none;-khtml-user-select:none";

    this.div_head = document.createElement('div');
    this.div_head.style.cssText = "direction: ltr; overflow: hidden; text-align: left; position: relative; color: rgb(0, 0, 0); font-family: Roboto,Arial,sans-serif; -moz-user-select:none;-webkit-user-select:none;-ms-user-select:none;-khtml-user-select: none; font-size: 11px; background-color: rgb(255, 255, 255); padding: 1px 6px; border-radius: 2px; background-clip: padding-box; border: 1px solid rgba(0, 0, 0, 0.15); box-shadow: 0px 1px 4px -1px rgba(0, 0, 0, 0.3); font-weight: 500;";
    this.div_head.title = options.title;

    google.maps.event.addDomListener(this.div_head, 'mouseover', function(){
        ctx.div_head.style.backgroundColor = "rgb(235,235,235)";
    });
    google.maps.event.addDomListener(this.div_head, 'mouseout', function(){
        ctx.div_head.style.backgroundColor = "rgb(255,255,255)";
    });

    this.header = document.createElement('span');
    this.header.innerHTML = (options.headerPrefix || "") + options.list[options.listDefault || 0];
    var arrow = document.createElement('img');
    arrow.src = "http://maps.gstatic.com/mapfiles/arrow-down.png";
    arrow.style.cssText = "-moz-user-select:none;-webkit-user-select:none;-ms-user-select:none;-khtml-user-select: none; border: 0px none; padding: 0px; margin: -2px 0px 0px; position: absolute; right: 6px; top: 50%; width: 7px; height: 4px;";

    this.div_head.appendChild(this.header);
    this.div_head.appendChild(arrow);
    this.div_.appendChild(this.div_head);

    // generate list of dropdown entries
    this.div_list = document.createElement('div');
    this.div_list.style.cssText = "background-color: white; z-index: -1; padding-top: 2px; background-clip: padding-box; border-width: 0px 1px 1px; border-style: none solid solid; border-color: use-text-color rgba(0, 0, 0, 0.15) rgba(0, 0, 0, 0.15); border-top-colors: none; border-right-colors: none; border-bottom-colors: none; border-left-colors: none; border-image: none; box-shadow: 0px 1px 4px -1px rgba(0, 0, 0, 0.3); position: relative; text-align: left; display: none;";

    var div_list = this.div_list;

    options.list.forEach(function(name) {
        var row = document.createElement('div');
        row.style.cssText = "color: rgb(86, 86, 86); font-family: Roboto,Arial,sans-serif; -moz-user-select:none;-webkit-user-select:none;-ms-user-select:none;-khtml-user-select: none; font-size: 11px; background-color: rgb(255, 255, 255); padding: 3px; padding-top: 2px; padding-bottom: 2px; line-height: 11px; font-weight: 500;";
        row.innerHTML = name;

        google.maps.event.addDomListener(row, 'click', function(){
            if(ctx.options.callback(row.innerHTML)) {
                ctx.header.innerHTML = (ctx.options.headerPrefix || "") + row.innerHTML;
                row.style.fontWeight = "800";
                row.style.color = "rgb(0,0,0)";
            }
        });
        google.maps.event.addDomListener(row, 'mouseover', function(){
            if(ctx.header.innerHTML == (ctx.options.headerPrefix || "") + row.innerHTML) {
                row.style.fontWeight = "800";
                row.style.color = "rgb(0,0,0)";
            }
            row.style.backgroundColor = "rgb(235,235,235)";
        });
        google.maps.event.addDomListener(row, 'mouseout', function(){
            row.style.fontWeight = "500";
            row.style.color = "rgb(86,86,86)";
            row.style.backgroundColor = "rgb(255,255,255)";
        });

        div_list.appendChild(row);
    });

    this.div_.appendChild(this.div_list);

    // add control
    options.map.controls[options.position].push(this.div_);

    // event for expanding

    google.maps.event.addDomListener(this.div_head, 'click', function(){
        clearTimeout(ctx.hideTimeout);
        div_list.style.display = (div_list.style.display != 'none') ? 'none' : 'block';
    });
    google.maps.event.addDomListener(this.div_, 'mouseout', function(){
        ctx.hideTimeout = setTimeout(function() { div_list.style.display = 'none'; }, 1000);
    });
    google.maps.event.addDomListener(this.div_, 'mouseover', function(){
        clearTimeout(ctx.hideTimeout);
    });
};
