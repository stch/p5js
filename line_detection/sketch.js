/// 準備
//// 色をクラスタ化処理するためのクラス
var ColorCluster = function (colorObj) {
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
ColorCluster.prototype.addColor = function (colstr) {
    if (this.colors[colstr]) {
        this.colors[colstr]++
    } else {
        this.colors[colstr] = 1
        this.length++
    }
}
ColorCluster.prototype.setColor = function (colstr, count) {
    if (!this.colors[colstr]) {
        this.length++
    }
    this.colors[colstr] = count
}
ColorCluster.prototype.getColor = function (colstr) {
    return this.colors[colstr]
}
ColorCluster.prototype.includes = function (colstr) {
    return this.colors[colstr] != undefined
}
ColorCluster.prototype.isInTheCluster = function (color) {
    console.assert(typeof (color) == "array", color)
    for (let col in this.colors) {
        if (isInSameCluster(str2col3(col), color)) return true
    }
    return false
}
ColorCluster.prototype.getFirstColorStr = function () {
    return Object.keys(this.colors)[0]
}
ColorCluster.prototype.forEach = function (callback, thisObj) {
    Object.keys(this.colors).forEach(callback, thisObj)
}

ColorCluster.prototype.getMostFQCol = function () {
    var colst = "889988FF" // マスク用の色
    var self = this
    this.forEach(function (key) {
        if (!self.colors[colst] || self.colors[key] > self.colors[colst]) {
            colst = key
        }
    })
    return colst
}

ColorCluster.prototype.getAverageCol = function () {
    var base = 0.0
    var self = this
    var col = Object.keys(this.colors).reduce(function (previousValue, currentValue, index, array) {
        base += self.colors[currentValue]
        var col4 = str2col4(currentValue)
        if (col4[3] != 0) {
            col4.forEach(function (c, ci) {
                previousValue[ci] += c * self.colors[currentValue]
            })
        }
        return previousValue
    }, [0.0, 0.0, 0.0, 0.0])
    return [col[0] / base, col[1] / base, col[2] / base, col[3] / base]
}

//// 色変数操作のためのヘルパー関数
//// 基本的にはColorObj内での使用にとどめておきたいなー(要refactor)
function color2str(col_arr) {
    return hex(int(col_arr), 2).join("")
}

function str2col3(str) {
    return unhex([str.slice(0, 2), str.slice(2, 4), str.slice(4, 6)])
}

function str2col4(str) {
    return unhex([str.slice(0, 2), str.slice(2, 4), str.slice(4, 6), str.slice(6, 8)])
}

//// canvas の pixel 値を取得してどうこうするヘルパー関数
///// funcPX(canvas_rgba,x,y,pixcount,pixel_width)
///// funcLine(line_num)
function canvasForEachPx(funcPX, funcLine, start_x, start_y, end_x, end_y) {
    if (!funcPX && !funcLine) return
    loadPixels()
    console.log("pixels.length: " + pixels.length + ", h:" + pixels.length / (4 * end_x) + " d:" + displayDensity())
    var pixel_width = c.width * displayDensity()
    var pixcount = 0
    for (let l = start_y; l < end_y; l++) {
        if (funcLine) funcLine(l)
        if (funcPX) {
            for (let i = (l * pixel_width + start_x) * 4; i < (l * pixel_width + end_x) * 4; i += 4) {
                funcPX([pixels[i], pixels[i + 1], pixels[i + 2], pixels[i + 3]], i, l, pixcount,pixel_width)
                pixcount++
            }
        }
    }
}
//// p5Imageのpixel操作のためのヘルパー関数
///// funcPX(p5image.pixels,x,y,pixcount)
///// funcLine(p5image.pixels,line_num)
function forEachPx(p5image, funcPX, funcLine) {
    if (!p5image || (!funcPX && !funcLine)) return
    p5image.loadPixels()
    var image_width = p5image.width * displayDensity()
    var image_height = p5image.height * displayDensity()
    var pixcount = 0
    for (let l = 0; l < image_height; l++) {
        if (funcLine) funcLine(p5image.pixels, l)
        if (funcPX) {
            for (let i = 0; i < image_width; i++) {
                funcPX(p5image.pixels, i, l, pixcount)
                pixcount++
            }
        }
    }
    p5image.updatePixels()
}

/////ここから本編
var img_p
var c
var ready = false
var colorClusters

function setup() {
    // create canvas
    //c = createCanvas(screen.width, screen.height);
    c = createCanvas(windowWidth, windowHeight);
    background(100);
    fill(255);
    noStroke();
    textSize(24);
    textAlign(CENTER);
    text('Drag an image file onto the canvas.', width / 2, height / 2);

    // Add an event for when a file is dropped onto the canvas
    c.drop(gotFile);
}

function gotFile(file) {
    ready = false
    // If it's an image file
    if (file.type === 'image') {
        clear()
        // Create an image DOM element but don't show it
        var img_s = createImg(file.data).hide(); //.attribute("width","50%")//こっちで設定してもデータサイズは変わらない

        // todo: なんとかして大きさを取得
        var t_width = 200
        var t_height = 150
        image(img_s, 0, 0, t_width / displayDensity(), t_height / displayDensity()); // retinaでdot by dotするときはdensityを考慮
        //filter(POSTERIZE,8);

        var pixel_width = c.width * displayDensity()
        loadPixels()

        // img_pに img_sの描画結果をコピー&使用する色をまとめる
        img_p = createImage(t_width, t_height)
        img_p._pixelDensity = displayDensity()

        var cluster = new ColorCluster()

        forEachPx(img_p, function (p_px, x, y, pxcount) {
            base_c = (y * pixel_width + x) * 4
            for (let i = 0; i < 4; i++) {
                p_px[pxcount * 4 + i] = pixels[base_c + i]
            }
            colstr = color2str([pixels[base_c], pixels[base_c + 1], pixels[base_c + 2], pixels[base_c + 3]])
            cluster.addColor(colstr)
        })

        console.log("load completed: clusters:" + cluster.length)
        img_s.remove()

        colorClusters = new Array()

        // とりあえず一つのオブジェクトに突っ込まれた要素をクラスタ化してglobal
        Array.prototype.push.apply(colorClusters, clusterize_devider(cluster))
        colorClusters.slice()
        colorClusters.sort(function (a, b) {
            return b.length - a.length
        })

        // 画像をクラスタの色のみにする。クラスタ外の色はalpha=0
        var targetCluster = colorClusters[0]
        forEachPx(img_p, function (p_px, x, y, pxcount) {
            if (!targetCluster.includes(color2str([
                    p_px[pxcount + 0],
                    p_px[pxcount + 1],
                    p_px[pxcount + 2],
                    p_px[pxcount + 3]
                ]))) {
                p_px[pxcount + 3] = 0
            }
        })

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
    console.assert(typeof (cola) == "array", cola)
    console.assert(typeof (colb) == "array", colb)
    return 32 > cola.reduce(function (previousValue, currentValue, index, array) {
        return previousValue + abs(currentValue - colb[index])
        //return max(previousValue,abs(currentValue - col3b[index]))
        //return min(previousValue, abs(currentValue - col3b[index]))
    }, 0)
}

function isInTheCluster(cl, color) {
    console.assert(typeof (color) == "array", color)
    console.assert(typeof (cl) == "object", cl)
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
    Object.keys(targetCluster.colors).sort().forEach(function (colst) {
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
    cluster.forEach(function (colst) {
        var colst_div = unhex(colst.slice(0, 6)) & 0xC0C0C0
        divider[colst_div].setColor(colst, cluster.getColor(colst))
        //console.log("仕分け中: "+colst_div)
    })

    // メッシュ毎の存在するオブジェクトをまとめる
    Object.keys(divider).forEach(function (colst_div) {
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
    cluster.forEach(function (colst) {
        // colstを含クラスターを洗い出し
        var incl_icl = new Array()
        temp_cl.forEach(function (cl, i) {
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
            var o = incl_icl.reduce(function (previousValue, currentValue, index, array) {
                // クラスタのコピー
                temp_cl[currentValue].forEach(function (colstr) {
                    previousValue.setColor(colstr, temp_cl[currentValue].getColor(colstr))
                })
                return previousValue
            }, new ColorCluster())
            temp_cl = temp_cl.filter(function (cl, i) {
                return !incl_icl.includes(i)
            })
        }
        o.setColor(colst, cluster.getColor(colst))
        temp_cl.push(o)
    })
    console.log(temp_cl)
    temp_cl.forEach(function (cl) {
        colorClusters.push(cl)
    })
    colorClusters.shift()
    console.log("E:clusterize_detail_top")
}

function drawCluster(dw) {
    colorClusters.forEach(function (cluster, i) {
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
var pa
var ppa

function drawAccumH(dw) {
    if (dw == 0) return
    // console.log("B:drawAccumH dw:" + dw)

    var dwt = dw * displayDensity()

    // 画面の絵を水平方向にaccumulation
    var accum = new Array(dwt)
    canvasForEachPx(
        function (canvas_rgba, i, l, pixcount,pixel_width) {
            var colst = "00000000"
            if (pixels[l * pixel_width * 4 + i + 3] != 0) {
                //colst = color2str([pixels[i], pixels[i + 1], pixels[i + 2], pixels[i + 3]])
                // とりあえず色のカウントに集中
                colst = color2str([88, 99, 66, 255])
            }
            accum[l].addColor(colst)
        },
        function (l) {
            // alpha==0のものは色計算に影響を与えないように別途席を確保
            accum[l] = new ColorCluster({
                "00000000": 0
            })
        }, 0, 0, dwt, dwt)

    // 続いて積算した値を列画像としてctに追加
    if (!ct) {
        ct = createImage(dw, dw)
        // 反映されないのか、、?
        ct._pixelDensity = displayDensity()
    }

    forEachPx(ct, 0, function (pxs, l) {
        var i = l * dwt * 4
        pxs.copyWithin(i + 4, i, i + dwt * 4 - 4)
        //    var col4 = str2col4(getClsMostFQCol(accum[l]))

        accum[l] = accum[l].getAverageCol()[3]

        stroke(0)
        line(0,l,2*(accum[l]-(accum[l-1]||0))/2.55,l)
//        line(0,l,3*(accum[l]-2*(accum[l-1]||0)+(accum[l-2]||0))/2.55,l)

        var rgba = [0.5,0.5,0.5,255]
		if(ppa){
            // pxs[i + 0] = 128 - pa[l]/2 //元の値
            // pxs[i + 1] = 128 - (ppa[l]-accum[l])*2 //一階差分
            // pxs[i + 2] = 128 - (ppa[l]-2*pa[l]+accum[l])*2 // 二階差分

			// var ddx = ppa[l]-accum[l]+((accum[l-1]?ppa[l-1]-accum[l-1]:0)+(accum[l+1]?ppa[l+1]-accum[l+1].getAverageCol()[3]:0))/sqrt(2)
			// var ddy = (pa[l+1]&&pa[l-1])?(pa[l+1]-pa[l-1]+(ppa[l+1]-ppa[l-1]+accum[l+1].getAverageCol()[3]-accum[l-1])/sqrt(2)):0
			// var ddr = sqrt(ddx*ddx+ddy*ddy)
			// var hlsa = ddr>0?p5.ColorConversion._hslaToRGBA([acos(ddx/ddr)/TWO_PI+(ddy<0.0?0.5:0.0),ddr/255.0,0.5,255]):[66,66,66]
            //rgba = p5.ColorConversion._hslaToRGBA([0.5 - (ppa[l]-accum[l])/127.0,accum[l]/255.0,0.5,255])
		}
        if(1<l){
            //rgba = p5.ColorConversion._hslaToRGBA([0.5 - (accum[l-2]-accum[l])/127.0,accum[l-1]/255.0,0.5,255])
            rgba = p5.ColorConversion._hslaToRGBA([accum[l-1]/255.0,0.5+(accum[l-2]+accum[l]-accum[l-1]*2)/40.0,0.5,255])
        }
        //pxs[i + 1] = ppa? (128 - (ppa[l]-2*pa[l]+accum[l])*2) : 255 // 二階差分
        pxs[i + 0] = rgba[0]*255.0
		pxs[i + 1] = rgba[1]*255.0	
        pxs[i + 2] = rgba[2]*255.0
        pxs[i + 3] = 255//accum[l]


	})
	ppa = pa;
	pa = accum
    // 描画
    image(ct, 100, 0) //,dw/displayDensity(),dw/displayDensity()
    // console.log("E:drawAccumH")
}
var rot
function draw() {
	//background(100);
	clear(0)
	if (ready) {
		rot = frameCount / 360.0
		// Draw the image onto the canvas
		var dw = img_p.width// /2
		var dh = img_p.height// /2
		var dd = sqrt(Math.pow(dw, 2) + Math.pow(dh, 2))

		push()
		translate(dd / 2, dd / 2)
		rotate(TWO_PI * rot)
		image(img_p, -dw / 2, -dh / 2,dw, dh);
		//    filter(POSTERIZE,3);
		pop()

        push()
        translate(dd,0)
		drawAccumH(dd)
        pop()

        push()
        translate(dd,0)
        drawCluster(dd)
        pop()
		// push()
		// 	translate(dd / 2, dd / 2)
		// 	for(let r = 0; r < 180; r++ ){
		// 		stroke()
		// 		point(-dw / 2, dw)
		// 		point(-dw / 2, 0)
		// 		rotate(TWO_PI * rot+r)
		// 	}
		// pop()
		} else {
		fill(100);
		noStroke();
		textSize(24);
		textAlign(CENTER);
		text('Drag an image file onto the canvas.', width / 2, height / 2);
	}
}
