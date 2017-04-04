var img
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
		img_t = createImg(file.data).hide(); //.attribute("width","50%")//こっちで設定してもデータサイズは変わらない
		// todo: なんとかしてリサイズする
		img = img_t; //pixels//p5.Image(300,400,img_t)//.resize(300,300)

		image(img, 0, 0)//, img.elt.width, img.elt.height);
		loadPixels()
    var pixel_width = c.width * displayDensity()
    var image_width = img.elt.width * displayDensity()
    var image_height = img.elt.height * displayDensity()

       var cluster = new Object()
       colorClusters.push(cluster)
		var pixcount = 0
		console.log("pixels.length: " + pixels.length + ", h:" + pixels.length / 4 / img.width+" d:"+displayDensity())
		for (let l = 0; l < image_height; l++){
      console.log("count: "+pixcount)
			for (let i = l * pixel_width*4; i < (l*pixel_width+ image_width)*4; i += 4) {
        pixcount++
				 colstr = color2str(pixels[i], pixels[i + 1], pixels[i + 2])
         colorClusters[0][colstr] = (colorClusters[0][colstr]+1) | 0
      }
    }
    while(need_clusterize && colorClusters.length > 0){
      clusterize()
    }
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
	return 64 > col3a.reduce(function(previousValue, currentValue, index, array) {
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

var need_clusterize = true
function clusterize(){
  if(!need_clusterize){
    return
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
    need_clusterize = false
    colorClusters.shift()
  }
  colorClusters.push(cluster)
  //console.log("clustering completed: " + colorClusters.length + ", pixx:" + pixcount)
}


function draw() {
	//background(100);
	clear()
	// Draw the image onto the canvas
	if (img) {
		//image(img, 0, 0, width*0.5, 0.5*img.height*width/img.width);
		image(img, 0, 0, img.width, img.height);
		//drawCluster
		colorClusters.forEach(function(cluster, i) {
			var count = img.width + 10;
			for (let cl in cluster) {
				if (cluster.hasOwnProperty(cl)) {
					stroke(cl)
					line(count, i * 3, count, i * 3 + 2)
					count++;
				}
			}
		})
    clusterize()
	} else {
		fill(255);
		noStroke();
		textSize(24);
		textAlign(CENTER);
		text('Drag an image file onto the canvas.', width / 2, height / 2);
	}
}
