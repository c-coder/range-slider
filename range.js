// -------------------------------------------
var eventMixin = {
    on: function (eventName, handler) {
      if (!this._eventHandlers) this._eventHandlers = {};
      if (!this._eventHandlers[eventName]) {
        this._eventHandlers[eventName] = [];
      }
      this._eventHandlers[eventName].push(handler);
    },
    off: function (eventName, handler) {
      var handlers = this._eventHandlers && this._eventHandlers[eventName];
      if (!handlers) return;
      for (var i = 0; i < handlers.length; i++) {
        if (handlers[i] == handler) {
          handlers.splice(i--, 1);
        }
      }
    },
    emit: function (eventName /*, ... */) {
      if (!this._eventHandlers || !this._eventHandlers[eventName]) {
        return; // обработчиков для события нет
      }
      // вызвать обработчики
      var handlers = this._eventHandlers[eventName];
      for (var i = 0; i < handlers.length; i++) {
        handlers[i].apply(this, [].slice.call(arguments, 1));
      }
    }
  };
  // --------------------------------------------

function InputRange(cssSelector) {
  this._range = document.querySelector(cssSelector);
  this._cssSelector = cssSelector;
  
}

for (var key in eventMixin) InputRange.prototype[key] = eventMixin[key];

// -----------------------------------------------------
InputRange.prototype._createHTML = function() {
  // html
  this._polzunok = document.createElement('div');
  this._polzunok.classList.add(this._cssSelector.slice(1) + '__polzunok');
  this._range.appendChild(this._polzunok);
    
  this._line = document.createElement('div');
  this._line.classList.add(this._cssSelector.slice(1) + '__line');
  this._range.appendChild(this._line);
  
  // style
  if (this.vertical) {
    var padding = this._range.clientWidth/2 - this.lineHeight/2;
    this._range.style.cssText = 'position: relative; padding-left: ' + padding + 'px';

    var margin = -this._polzunok.offsetHeight/2;
    var value = Math.round((this.value - this.min) / this.step) * this._stepPx;
    this._polzunok.style.cssText = 'position: absolute; left: 0px; bottom:' + value + 'px; margin-bottom: ' + margin + 'px';

    this._line.style.cssText = 'height: 100%; width:' + this.lineHeight + 'px';

  } else {
    var padding = this._range.clientHeight/2 - this.lineHeight/2;
    this._range.style.cssText = 'position: relative; padding-top: ' + padding + 'px';
    
    var margin = -this._polzunok.offsetWidth/2;
    var value = Math.round((this.value - this.min) / this.step) * this._stepPx;
    this._polzunok.style.cssText = 'position: absolute; bottom: 0px; left:' + value + 'px; margin-left: ' + margin + 'px';
    
    this._line.style.height = this.lineHeight + 'px';
  }
}
// -----------------------------------------------------
InputRange.prototype._move = function(e) {
  // console.log('in move function');
  if (this.vertical) {
    var offset = -(e.clientY - this._range.getBoundingClientRect().bottom); 
    offset = Math.round(offset / this._stepPx) * this._stepPx; // учитываем дискретность (шаг)

    if (offset > this._range.clientHeight) offset = this._range.clientHeight;
    if (offset < 0) offset = 0;

    this._polzunok.style.bottom = offset +'px';

  } else {
    //координаты клика относительно начала слайдера
    var offset = e.clientX - this._range.getBoundingClientRect().left; 
    offset = Math.round(offset / this._stepPx) * this._stepPx; // учитываем дискретность (шаг)
    
    // отсечки справа и слева
    if (offset > this._range.clientWidth) offset = this._range.clientWidth;
    if (offset < 0) offset = 0;
    
    this._polzunok.style.left = offset +'px';
  }

  var newValue = Math.round(offset / this._stepPx * this.step + this.min);
   
  if (newValue != this.value) {
    this.value = newValue;
    this.emit('change');
  }
}
// -----------------------------------------------------

InputRange.prototype.create = function(prop) {
  prop = (prop instanceof Object) ? Object.create(prop) : {};

  this.min = isNaN(prop.min) ? 0 : prop.min;
  this.max = isNaN(prop.max) ? 100 : prop.max;
  this.step = isNaN(prop.step) ? 5 : prop.step;
  this.value = isNaN(prop.value) ? (this.max - this.min) / 2 : prop.value;
  this.lineHeight = isNaN(prop.lineHeight) ? 5 : prop.lineHeight;
  this.vertical = prop.vertical===undefined ? false : prop.vertical;

  this._mouseDown = false;
  
  this._stepPx = 
    (this.vertical ? this._range.clientHeight : this._range.clientWidth) /
    (this.max - this.min) * this.step;

  this._createHTML();

  this._range.addEventListener('mousedown', function(e) {
    this._mouseDown = true;
    this._move.call(this, e);
  }.bind(this));
    
  document.addEventListener('mousemove', function(e) {
    if(this._mouseDown) this._move.call(this, e);
  }.bind(this));
  
  document.addEventListener('mouseup', function() {
    this._mouseDown = false;
  }.bind(this));

  this._range.addEventListener('dragstart', function(e) {
    e.preventDefault();
  });

  // ------------- mobile
  this._range.addEventListener('touchstart', function(e) {
    e.preventDefault();
    this._mouseDown = true;
    this._move.call(this, e.changedTouches[0]);
  }.bind(this));

  this._range.addEventListener('touchmove', function(e) {
    e.preventDefault();
    if(this._mouseDown) this._move.call(this, e.changedTouches[0]);
  }.bind(this));

  document.addEventListener('touchend', function(e) {
    this._mouseDown = false;
  }.bind(this));

  return this;
}

InputRange.prototype.set = function(value) {
  if (value == this.value || isNaN(value)) return this;
  if (value > this.max) value = this.max;
  if (value < this.min) value = this.min;

  var offset = Math.round(value/this.step) * this._stepPx;
  if (this.vertical) {
    this._polzunok.style.bottom = offset +'px';
  } else {
    this._polzunok.style.left = offset +'px';
  }

  this.value = value;
  return this;
}