var ColorCluster = function(colorObj) {
	if (!(this instanceof ColorCluster)) {
		return new ColorCluster();
	}
	// 実体。プロパティ名が色で値が色数を保持するところ
	if (colorObj && colorObj instanceof Object) {
		this.colors = colorObj // new した方が良いが
		this.length = Object.keys(this.colors).length;
	} else {
		this.colors = new Object();
		this.length = 0;
	}
}
ColorCluster.prototype.addColor = function(colstr) {
	if (this.colors[colstr]) {
		this.colors[colstr]++
	} else {
		this.colors[colstr] = 1
		this.length++
	}
}
ColorCluster.prototype.setColor = function(colstr, count) {
	if (!this.colors[colstr]) {
		this.length++
	}
	this.colors[colstr] = count
}
ColorCluster.prototype.getColor = function(colstr) {
	return this.colors[colstr]
}
ColorCluster.prototype.includes = function(colstr) {
	return this.colors[colstr] != undefined
}
ColorCluster.prototype.isInTheCluster = function(color) {
	console.assert(typeof(color) == "array", color)
	for (let col in this.colors) {
		if (isInSameCluster(str2col3(col), color)) return true
	}
	return false
}
ColorCluster.prototype.getFirstColorStr = function() {
	return Object.keys(this.colors)[0]
}
ColorCluster.prototype.forEach = function(callback, thisObj) {
	Object.keys(this.colors).forEach(callback, thisObj)
}

ColorCluster.prototype.getMostFQCol = function() {
	var colst = "889988FF" // マスク用の色
	var self = this
	this.forEach(function(key) {
		if (!self.colors[colst] || self.colors[key] > self.colors[colst]) {
			colst = key
		}
	})
	return colst
}

ColorCluster.prototype.getAverageCol = function() {
	var base = 0.0
	var self = this
	var col = Object.keys(this.colors).reduce(function(previousValue, currentValue, index, array) {
		base += self.colors[currentValue]
		var col4 = str2col4(currentValue)
		if (col4[3] != 0) {
			col4.forEach(function(c, ci) {
				previousValue[ci] += c * self.colors[currentValue]
			})
		}
		return previousValue
	}, [0.0, 0.0, 0.0, 0.0])
	return color2str([col[0] / base, col[1] / base, col[2] / base, col[3] / base])
}

var img_p
var c
var ready = false
var colorClusters

function setup() {
	// create canvas
	c = createCanvas(screen.width, screen.height);
	background(100);
	fill(255);
	noStroke();
	textSize(24);
	textAlign(CENTER);
	text('Drag an image file onto the canvas.', width / 2, height / 2);

	// Add an event for when a file is dropped onto the canvas
	c.drop(gotFile);
}

function color2str(col_arr) {
	return hex(int(col_arr), 2).join("")
}

function str2col3(str) {
	return unhex([str.slice(0, 2), str.slice(2, 4), str.slice(4, 6)])
}

function str2col4(str) {
	return unhex([str.slice(0, 2), str.slice(2, 4), str.slice(4, 6), str.slice(6, 8)])
}

function gotFile(file) {
	ready = false
	// If it's an image file
	if (file.type === 'image') {
		clear()
		// Create an image DOM element but don't show it
		var img_s = createImg(file.data).hide(); //.attribute("width","50%")//こっちで設定してもデータサイズは変わらない

		// todo: なんとかして大きさを取得
		var t_width = 400
		var t_height = 300
		image(img_s, 0, 0, t_width / displayDensity() , t_height /displayDensity() ); // retinaでdot by dotするときはdensityを考慮
		//filter(POSTERIZE,8);

		var pixel_width = c.width * displayDensity()
		var image_width = t_width * displayDensity() //img_s.elt.width * displayDensity()
		var image_height = t_height * displayDensity() //img_s.elt.height * displayDensity()

		loadPixels()
		console.log("pixels.length: " + pixels.length + ", h:" + pixels.length / (4 * image_width) + " d:" + displayDensity())

		// img_pに img_sの描画結果をコピー&使用する色をまとめる
		img_p = createImage(t_width, t_height)
		img_p._pixelDensity = displayDensity()
		img_p.loadPixels()
		//img_p.pixels.fill(88)//抜け確認
		var cluster = new ColorCluster()
		var pixcount = 0
		for (let l = 0; l < image_height; l++) {
			//			console.log("count: "+pixcount)
			for (let i = l * pixel_width * 4; i < (l * pixel_width + image_width) * 4; i += 4) {
				img_p.pixels[pixcount * 4 + 0] = pixels[i + 0]
				img_p.pixels[pixcount * 4 + 1] = pixels[i + 1]
				img_p.pixels[pixcount * 4 + 2] = pixels[i + 2]
				img_p.pixels[pixcount * 4 + 3] = pixels[i + 3]
				colstr = color2str([pixels[i], pixels[i + 1], pixels[i + 2], pixels[i + 3]])
				cluster.addColor(colstr)
				pixcount++
			}
		}
		//console.log("load completed: " + Object.keys(cluster).length)
		console.log("load completed: " + cluster.length)
		img_s.remove()

		colorClusters = new Array()

		// とりあえず一つのオブジェクトに突っ込まれた要素をクラスタ化してglobal
		Array.prototype.push.apply(colorClusters, clusterize_devider(cluster))
		colorClusters.slice()
		colorClusters.sort(function(a, b) {
			return b.length - a.length
		})

		// 画像をクラスタの色のみにする。クラスタ外の色はalpha=0
		var targetCluster = colorClusters[0]
		for (let i = 0; i < img_p.pixels.length; i += 4) {
			if (!targetCluster.includes(color2str([img_p.pixels[i], img_p.pixels[i + 1], img_p.pixels[i + 2], img_p.pixels[i + 3]]))) {
				img_p.pixels[i + 3] = 0
			}
		}
		img_p.updatePixels()

		ready = true
	} else {
		println('Not an image file!');
	}
	console.log("got finish." + colorClusters.length)
}

function getNearestColors(col3) {
	var arr = new Array()
	for (let i = (col3[0] > 0 ? col3[0] - 1 : 0); i <= col3[0] + 1 && i <= 255; i++) {
		for (let j = (col3[1] > 0 ? col3[1] - 1 : 0); j <= col3[1] + 1 && j <= 255; j++) {
			for (let k = (col3[2] > 0 ? col3[2] - 1 : 0); k <= col3[2] + 1 && k <= 255; k++) {
				arr.push([i, j, k])
			}
		}
	}
	return arr
}

function isInSameCluster(cola, colb) {
	console.assert(typeof(cola) == "array", cola)
	console.assert(typeof(colb) == "array", colb)
	return 32 > cola.reduce(function(previousValue, currentValue, index, array) {
		return previousValue + abs(currentValue - colb[index])
		//return max(previousValue,abs(currentValue - col3b[index]))
		//return min(previousValue, abs(currentValue - col3b[index]))
	}, 0)
}

function isInTheCluster(cl, color) {
	console.assert(typeof(color) == "array", color)
	console.assert(typeof(cl) == "object", cl)
	for (let col in cl) {
		if (isInSameCluster(str2col3(col), color)) return true
	}
	return false
	//  return getNearestColors(col3).some(function(col){return cl.hasOwnProperty(col32str(col))})
}

var need_clusterize_tc = true

function clusterize_tipical_center(targetCluster) {
	if (!need_clusterize_tc) {
		return false
	}
	// クラスタ処理
	// colstを含むClusterを探す
	// 隣接するclusterも含む、結果はincludesClにインデックスで保存

	// 先頭クラスタ=未処理、の先頭要素をとってくる
	var cluster = new ColorCluster()
	colstr = targetCluster.getFirstColorStr()


	console.log("before: " + targetCluster.length)
	Object.keys(targetCluster.colors).sort().forEach(function(colst) {
		if (isInSameCluster(str2col3(colstr), str2col3(colst))) {
			//            cluster.colors[colst] = colorClusters[0][colst]
			cluster.setColor(colst, targetCluster.getColor(colst))
		}
	})
	//メソッドにしたほうがいい。後でやる
	// Object.keys(cluster).forEach(function(colst) {
	//     delete colorClusters[0][colst]
	// })
	// console.log("after: " + Object.keys(colorClusters[0]).length + " + " + Object.keys(cluster).length)
	//
	// if (Object.keys(colorClusters[0]).length == 0) {
	//     need_clusterize_tc = false
	//     colorClusters.shift()
	// }
	// colorClusters.push(cluster)
	// //console.log("clustering completed: " + colorClusters.length + ", pixx:" + pixcount)
	// return need_clusterize_tc
}


// クラスタを受け取ってメッシュごとに分けて返す
function clusterize_devider(cluster) {
	var ret_arr = new Array()
	console.log("B:clusterize_devider :")
	// 各辺4分割、計64個仕様
	//まずは作業用のお部屋を準備
	var ldv = 2
	var dv = Math.pow(2, ldv)
	var divider = new ColorCluster()
	for (let i = 0; i < (1 << (3 * ldv)); i++) {
		divider[((i & 0b110000) << 18) + ((i & 0b001100) << 12) + ((i & 0b000011) << 6)] = new ColorCluster()
	}
	// メッシュに振り分け
	// Object のキー自体にメッシュの位置情報を埋め込むことで振り分けを実現
	cluster.forEach(function(colst) {
		var colst_div = unhex(colst.slice(0, 6)) & 0xC0C0C0
		divider[colst_div].setColor(colst, cluster.getColor(colst))
		//console.log("仕分け中: "+colst_div)
	})
	// メッシュ毎の存在するオブジェクトをまとめる
	Object.keys(divider).forEach(function(colst_div) {
		console.log("c:" + hex(Number(colst_div)) + ", s:" + Object.keys(divider[colst_div]).length)
		if (divider[colst_div].length > 0) {
			ret_arr.push(divider[colst_div])
		}
	})
	console.log("E:clusterize_devider + " + ret_arr.length)
	return ret_arr
}

// 先頭クラスタを詳細マッチング
function clusterize_detail_top(cluster) {
	// 関数化とClusterObj対応は後である
	console.log("B:clusterize_detail_top: " + Object.keys(colorClusters[0]).length)
	var temp_cl = new Array()
	cluster.forEach(function(colst) {
		var incl_icl = new Array()
		temp_cl.forEach(function(cl, i) {
			if (cl.isInTheCluster(str2col3(colst))) {
				incl_icl.push(i)
			}
		})
		//console.log(temp_cl)
		//console.log(incl_icl)
		var o
		if (incl_icl.length == 0) {
			o = new ColorCluster()
		} else if (incl_icl.length == 1) {
			o = temp_cl[incl_icl[0]]
		} else if (incl_icl.length > 1) {
			// 複数ある場合はクラスタを合成
			var o = incl_icl.reduce(function(previousValue, currentValue, index, array) {
				// クラスタのコピー
				temp_cl[currentValue].forEach(function(colstr) {
					previousValue.setColor(colstr, temp_cl[currentValue].getColor(colstr))
				})
				return previousValue
			}, new ColorCluster())
			temp_cl = temp_cl.filter(function(cl, i) {
				return !incl_icl.includes(i)
			})
		}
		o.setColor(colst, cluster.getColor(colst))
		temp_cl.push(o)
	})
	console.log(temp_cl)
	temp_cl.forEach(function(cl) {
		colorClusters.push(cl)
	})
	colorClusters.shift()
	console.log("E:clusterize_detail_top")
}

function drawCluster(dw) {
	colorClusters.forEach(function(cluster, i) {
		var count = dw + 10;
		for (let colst in cluster.colors) {
			if (cluster.colors.hasOwnProperty(colst)) {
				stroke("#" + colst)
				line(i * 5, count, i * 5 + 4, count)
				count++;
			}
		}
	})
	//clusterize_detail_top()
	//clusterize()
}

var ct

function drawAccumH(dw) {
	if (dw == 0) return
	console.log("B:drawAccumH dw:" + dw)

	var pixel_width = c.width * displayDensity() * 2 //なぜが2倍するとうまくいくが？?
	var dwt = dw * displayDensity()

	// 画面の絵を水平方向にaccumulation
	loadPixels()
	var accum = new Array(dwt)
	var pixcount = 0
	for (let l = 0; l < dwt; l++) {
		//console.log("count: "+pixcount)
		// alpha==0のものは色計算に影響を与えないように別途席を確保
		accum[l] = new ColorCluster({
			"00000000": 0
		})
		for (let i = l * pixel_width * 4; i < (l * pixel_width + dwt) * 4; i += 4) {
			pixcount++
			var colst = "00000000"
			if (pixels[i + 3] != 0) {
				colst = color2str([pixels[i], pixels[i + 1], pixels[i + 2], pixels[i + 3]])
			}
			accum[l].addColor(colst)
		}
	}
	//console.log(accum)
	// 続いて積算した値を列画像としてctに追加
	if (!ct) {
		ct = createImage(dw, dw)
		// 反映されないのか、、?
		ct._pixelDensity = displayDensity() //*2
	}
	ct.loadPixels()
	for (let l = 0; l < dwt; l++) {
		var i = l * dwt * 4
		ct.pixels.copyWithin(i + 4, i, i + dwt * 4 - 4)
		//    var col4 = str2col4(getClsMostFQCol(accum[l]))
		var col4 = str2col4(accum[l].getAverageCol())
		col4.forEach(function(c, ci) {
			ct.pixels[i + ci] = c
		})
	}
	ct.updatePixels()

	// 描画
	image(ct, dw, 0) //,dw/displayDensity(),dw/displayDensity()
	console.log("E:drawAccumH")
}

function draw() {
	//background(100);
	clear()
	if (ready) {
		// Draw the image onto the canvas
		var dw = img_p.width /2
		var dh = img_p.height/2
		var dd = sqrt(Math.pow(dw, 2) + Math.pow(dh, 2))
		push()
		translate(dd / 2, dd / 2)
		rotate(TWO_PI * (frameCount / 360.0))
		image(img_p, -dw / 2, -dh / 2,dw, dh);
		//    filter(POSTERIZE,3);
		pop()
		drawCluster(dd)
		drawAccumH(dd)

	} else {
		fill(100);
		noStroke();
		textSize(24);
		textAlign(CENTER);
		text('Drag an image file onto the canvas.', width / 2, height / 2);
	}
}
