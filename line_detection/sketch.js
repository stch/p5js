var img_s
var c

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

function gotFile(file) {
	// If it's an image file
	if (file.type === 'image') {
		// Create an image DOM element but don't show it
		img_s = createImg(file.data).hide(); //.attribute("width","50%")//こっちで設定してもデータサイズは変わらない

		// todo: なんとかしてリサイズする
		//img_s = this; //pixels//p5.Image(300,400,img_s_t)//.resize(300,300)
		image(img_s, 0, 0, c.width/2, c.height/2);
    var pixel_width = c.width * displayDensity()
    var image_width = 400*displayDensity()//img_s.elt.width * displayDensity()
    var image_height = 300*displayDensity()//img_s.elt.height * displayDensity()

		loadPixels()

       var cluster = new Object()
       colorClusters.push(cluster)
		var pixcount = 0
		console.log("pixels.length: " + pixels.length + ", h:" + pixels.length / 4 /image_width+" d:"+displayDensity())
		for (let l = 0; l < image_height; l++){
      console.log("count: "+pixcount)
			for (let i = l * pixel_width*4; i < (l*pixel_width+ image_width)*4; i += 4) {
        pixcount++
				 colstr = color2str(pixels[i], pixels[i + 1], pixels[i + 2])
         colorClusters[0][colstr] = (colorClusters[0][colstr]+1) || 1
      }
    }
    //while(need_clusterize && colorClusters.length > 0){
      clusterize_devider()
    //}
  } else {
  	println('Not an image file!');
  }
  console.log("got finish."+colorClusters.length)
}



var colorClusters = new Array()

function color2str(r, g, b) {
	return "#" + hex(r, 2) + hex(g, 2) + hex(b, 2)
}

function col32str(col3) {
	return "#" + hex(col3, 2).join()
}

function str2col3(str) {
	return unhex([str.slice(1, 3), str.slice(3, 5), str.slice(5, 7)])
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

function isInSameCluster(col3a, col3b) {
	return 32 > col3a.reduce(function(previousValue, currentValue, index, array) {
		return previousValue + abs(currentValue - col3b[index])
    //return max(previousValue,abs(currentValue - col3b[index]))
		//return min(previousValue, abs(currentValue - col3b[index]))
	}, 0)
}

function isInTheCluster(cl, col3) {
	 for (let col in cl) {
	 	if (isInSameCluster(str2col3(col), col3)) return true
	 }
	return false
  //  return getNearestColors(col3).some(function(col){return cl.hasOwnProperty(col32str(col))})
}

var need_clusterize_tc = true
function clusterize_tipical_center(){
  if(!need_clusterize_tc){
    return false
  }
  // クラスタ処理
  // colstを含むClusterを探す
  // 隣接するclusterも含む、結果はincludesClにインデックスで保存

  // 先頭クラスタ=未処理、の先頭要素をとってくる
  var cluster = new Object()
  colstr = Object.keys(colorClusters[0])[0]
  //cluster[colstr] = colorClusters[0][colstr]
  //delete colorClusters[0][colstr]

  console.log("before: "+Object.keys(colorClusters[0]).length)
  Object.keys(colorClusters[0]).sort().forEach(function(colst){
    if(isInSameCluster(str2col3(colstr),str2col3(colst))){
      cluster[colst] = colorClusters[0][colst]
    }
  })
  Object.keys(cluster).forEach(function(colst){
    delete colorClusters[0][colst]
  })
  console.log("after: "+Object.keys(colorClusters[0]).length+" + "+Object.keys(cluster).length)

  if(Object.keys(colorClusters[0]).length == 0){
    need_clusterize_tc = false
    colorClusters.shift()
  }
  colorClusters.push(cluster)
  //console.log("clustering completed: " + colorClusters.length + ", pixx:" + pixcount)
  return need_clusterize_tc
}

// 各辺4分割、計64個仕様
//まずは作業用のお部屋を準備
var divider = new Object()
for(let i = 0; i<2**6; i++){
  divider[((i&0b110000)<<18)+((i&0b001100)<<12)+((i&0b000011)<<6)] = new Object()
}
function clusterize_devider(){
  console.log("B:clusterize_devider")
  // 作業対象は先頭クラスタ
  Object.keys(colorClusters[0]).forEach(function(colst){
    var colst_div = unhex(colst.slice(1, 7)) & 0xC0C0C0
    divider[colst_div][colst] = colorClusters[0][colst]
    //console.log("仕分け中: "+colst_div)
  })
  Object.keys(divider).forEach(function(colst_div){
    console.log("c:"+hex(Number(colst_div))+", s:"+Object.keys(divider[colst_div]).length)
    if(Object.keys(divider[colst_div]).length > 0){
      colorClusters.push(divider[colst_div])
    }
  })
  colorClusters.shift()
  console.log("E:clusterize_devider")
}

// 先頭クラスタを詳細マッチング
function clusterize_detail_top(){
  console.log("B:clusterize_detail_top: "+Object.keys(colorClusters[0]).length)
  var temp_cl = new Array()
  Object.keys(colorClusters[0]).forEach(function(colst){
    var incl_icl = new Array()
    temp_cl.forEach(function(cl,i){
      if(isInTheCluster(cl,str2col3(colst))){
        incl_icl.push(i)
      }
    })
    //console.log(temp_cl)
    //console.log(incl_icl)
    var o
    if(incl_icl.length==0){
      o = new Object()
    }else if(incl_icl.length==1){
      o = temp_cl[incl_icl[0]]
    }else if(incl_icl.length>1){
      // 複数ある場合はクラスタを合成
      var o = incl_icl.reduce(function(previousValue, currentValue, index, array){
        // クラスタのコピー
        Object.keys(temp_cl[currentValue]).forEach(function(colstr){
          previousValue[colstr] = temp_cl[currentValue][colstr]
        })
        return previousValue
      },new Object())
      temp_cl = temp_cl.filter(function(cl,i){return !incl_icl.includes(i)})
    }
    o[colst] = colorClusters[0][colst]
    temp_cl.push(o)
  })
  console.log(temp_cl)
  temp_cl.forEach(function(cl){colorClusters.push(cl)})
  colorClusters.shift()
  console.log("E:clusterize_detail_top")
}
/*
var near_cluster_p = new Object()
for(let i = 0; i<2**6; i++){
  near_cluster_p[((i&0b110000)<<18)+((i&0b001100)<<12)+((i&0b000011)<<6)] = new Object()
}
var near_cluster_n = new Object()
function near_cluster(){

}
*/

function draw() {
	//background(100);
	clear()
	// Draw the image onto the canvas
	if (img_s) {
		//image(img_s, 0, 0, width*0.5, 0.5*img_s.height*width/img_s.width);
		image(img_s, 0, 0, img_s.width, img_s.height);
		//drawCluster
		colorClusters.forEach(function(cluster, i) {
			var count = img_s.width + 10;
			for (let cl in cluster) {
				if (cluster.hasOwnProperty(cl)) {
					stroke(cl)
					line(count, i * 3, count, i * 3 + 2)
					count++;
				}
			}
		})
    clusterize_detail_top()
    //clusterize()
	} else {
		fill(255);
		noStroke();
		textSize(24);
		textAlign(CENTER);
		text('Drag an image file onto the canvas.', width / 2, height / 2);
	}
}
