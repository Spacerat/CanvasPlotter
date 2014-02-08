
/*global functions*/

['abs', 'acos', 'asin', 'atan', 'atan2', 'ceil', 'cos', 'exp', 'floor', 'log', 'max', 'min', 'pow', 'random', 'round', 'sin', 'sqrt', 'tan', 'PI', 'E'].forEach(function(n) {
	window[n] = Math[n];
});
e = E;

function RGBA(r, g, b, a) {
	if (a === undefined) {
		a = 1;
	}
	return [r * 255, g * 255, b * 255, a * 255];
}
RGB = RGBA;

function HSLA(h, s, l, a) {
	var m1, m2, hue;
	var r, g, b
	h = h % (2*PI);
	if (s == 0)
		r = g = b = (l * 255);
	else {
		if (l <= 0.5)
			m2 = l * (s + 1);
		else
			m2 = l + s - l * s;
		m1 = l * 2 - m2;
		hue = h / (Math.PI * 2);
		r = HueToRgb(m1, m2, hue + 1/3);
		g = HueToRgb(m1, m2, hue);
		b = HueToRgb(m1, m2, hue - 1/3);
	}
	if (a!== undefined) {
		return [r, g, b, a * 255];
	}
	else {
		return [r, g, b, 255];
	}
}
HSL = HSLA;
var HueToRgb = function(m1, m2, hue) {
	var v;
	if (hue < 0)
		hue += 1;
	else if (hue > 1)
		hue -= 1;

	if (6 * hue < 1)
		v = m1 + (m2 - m1) * hue * 6;
	else if (2 * hue < 1)
		v = m2;
	else if (3 * hue < 2)
		v = m1 + (m2 - m1) * (2/3 - hue) * 6;
	else
		v = m1;

	return 255 * v;
}


function alphaBlend(aa, bb) {
	var a = aa.map(function(x){return x/255});
	var b = bb.map(function(x){return x/255});
	return [
		a[0]*a[3] + b[0] * b[3] * (1 - a[3]),
		a[1]*a[3] + b[1] * b[3] * (1 - a[3]),
		a[2]*a[3] + b[2] * b[3] * (1 - a[3]),
		a[3] + b[3] * (1 - a[3])
	].map(function(x){return x*255});
}

function _pixelAtPoint(x, y) {
	var i = Graph.canvas.width * y * 4 + x*4;
	return [Graph.data[i], Graph.data[i + 1], Graph.data[i + 2], Graph.data[i + 3]];
}
function _setPixel(x, y, p) {
	var i = Graph.canvas.width * y * 4 + x*4;
	if (x < 0) return;
	if (x > Graph.canvas.width) return;
	if (y < 0) return;
	if (y > Graph.canvas.height) return;
	Graph.data[i + 0] = p[0];
	Graph.data[i + 1] = p[1];
	Graph.data[i + 2] = p[2];
	Graph.data[i + 3] = p[3];
}

function fillCanvas(pixel) {
	var x, y;
	var canv = Graph.canvas;
	var ctx = Graph.ctx;
	var imgd = ctx.getImageData(0, 0, canv.width, canv.height);
	Graph.data = imgd.data;
	var kx = width / canv.width;
	var ky = height / canv.height;
	
	var dofunc, p;
	if (typeof pixel === 'function') {
		dofunc = true;
	}
	else if (typeof pixel === 'object') {
		dofunc = false;
		p = pixel;
	}
	for (y = 0; y < canv.width; y++) {
		for (x = 0; x < canv.height; x++) {
			if (dofunc) {
				p = pixel(x * kx - width/2, height/2 - y * ky);
			}
			if (p == null) p = [0,0,0,0];
			if (p.length === 3) p.push(255);
			var b = _pixelAtPoint(x, y);
			blended = alphaBlend(p, b);
			_setPixel(x, y, blended);
			
		}
	}
	ctx.putImageData(imgd, 0, 0);
}

function in_circle(x, y, a, b, r_squared) {
	if (Math.pow((x - a), 2) + Math.pow((y - b), 2) < r_squared) return true;
}

function Clear() {
	Graph.ctx.clearRect(0, 0, Graph.canvas.width, Graph.canvas.height);
}

function Plot(from, to, step, func, col) {
	var t;
	
	var canv = Graph.canvas;
	var ctx = Graph.ctx;
	var imgd = ctx.getImageData(0, 0, canv.width, canv.height);
	Graph.data = imgd.data;
	var kx = width / canv.width;
	var ky = height / canv.height;
	
	if (step == 0) step = 1;
	var colfunc = false, c = col;
	if (typeof col === 'function') {
		colfunc = true;
	}
	else if (col === undefined) {
		c = [0, 0, 0, 255];
	}
	for (t = from; t <= to; t+=step) {
		var coord = func(t);
		if (typeof coord === 'number') {
			coord = [t, coord];
		}
		coord = [round(coord[0]/kx) + Graph.canvas.width/2, Graph.canvas.height/2 - round(coord[1] / ky)];
		if (colfunc) c = col(t);
		if (c.length === 3) c.push(255);
		var b = alphaBlend(c, _pixelAtPoint(coord[0], coord[1]));
		_setPixel(coord[0], coord[1], c);
	}
	ctx.putImageData(imgd, 0, 0);
}

function PlotY(func, col) {
	Plot(-width, width, width/(Graph.canvas.width*2), func, col);
}

Graph = {};

Graph.Initialise = function() {
	var editor = CodeMirror.fromTextArea(document.getElementById("code"), {
		lineNumbers: true,
		matchBrackets: true,
		tabMode: 'indent'
	});
	Graph.editor = editor;
	Graph.canvas = document.getElementById("canv");
	Graph.ctx = Graph.canvas.getContext('2d');

	var go = function() {
		try {
			Graph.w = eval(document.getElementById("w").value) * 2;
			Graph.h = eval(document.getElementById("h").value) * 2;
			width = Graph.w;
			height = Graph.h;
			eval(editor.getValue());
			outp.innerHTML="";
		}
		catch (err) {
			console.log(err);
			outp.innerHTML = "<pre>"+err.stack+"</pre>";
		}
	};
	document.getElementById("run").onclick = go;
	
	QS = (function() {
		var result = {}, queryString = location.search.substring(1),
			re = /([^&=]+)=([^&]*)/g, m;

		while (m = re.exec(queryString)) {
		result[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
		return result;
	}})();
	
	if (QS && QS['code']) {
		editor.setValue(QS['code']);
		if (QS['width']) $('#w').val(QS['width']);
		if (QS['height']) $('#h').val(QS['height']);
		go();
	}
	else {
		go();
	}
}
Graph.encode = function() {
	var v = Graph.editor.getValue();
	var enc = encodeURIComponent(v);
	return '?code='+enc+'&width='+encodeURIComponent($('#w').val())+'&height='+encodeURIComponent($('#h').val());
}


$(function() {
	Graph.Initialise();
	$("pre.example").wrap(function() {
		return '<div class="example"></div>';
	}).after(function(){
		var elm = document.createElement("a");
		var pre = this;
		elm.onclick = function() {
			Graph.editor.setValue(pre.innerHTML);
		}
		elm.innerHTML="Try this example";
		elm.href="#";
		return elm;
	});
	$("#save").click(function() {
		var strDataURI = Graph.canvas.toDataURL();
		window.open(strDataURI);
	});
	
	$("#geturl").click(function() {
		location.search = Graph.encode();
	});

});