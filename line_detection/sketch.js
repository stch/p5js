
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
  text('Drag an image file onto the canvas.', width/2, height/2);

  // Add an event for when a file is dropped onto the canvas
  c.drop(gotFile);
}

function gotFile(file) {
  // If it's an image file
  if (file.type === 'image') {
    // Create an image DOM element but don't show it
    img_t = createImg(file.data).hide();//.attribute("width","50%")//こっちで設定してもデータサイズは変わらない
    // todo: なんとかしてリサイズする
     img = img_t;//pixels//p5.Image(300,400,img_t)//.resize(300,300)

     image(img, 0, 0, img.width, img.height);
     loadPixels()
     for(let i = 0; i < pixels.length; i += 4){
       colst = color2str(pixels[i],pixels[i+1],pixels[i+2])
       // colstが既存Clusterにある？
       if(colorClusters.any(function(cl){
         !cl.hasOwnProperty(colst))
       })){
         //無ければ新しく追加
       }
     }

  } else {
    println('Not an image file!');
  }
}
var colorClusters = new Array()

function color2str(r,g,b){
  return "#"+hex(r)+hex(g)+hex(b)
}

function draw() {
  //background(100);
  clear()
  // Draw the image onto the canvas
  if(img){
    //image(img, 0, 0, width*0.5, 0.5*img.height*width/img.width);
    image(img, 0, 0, img.width, img.height);
    //drawCluster
    colorClusters.forEach(function(cluster, i) {
    	var count = img.width+10;
    	for (let cl in cluster) {
    		if (cluster.hasOwnProperty(cl)) {
    			stroke(cl)
    			line(count, count, i * 10, i * 10 + 10)
          count++;
    		}
    	}
    })
  }else{
    fill(255);
    noStroke();
    textSize(24);
    textAlign(CENTER);
    text('Drag an image file onto the canvas.', width/2, height/2);
  }
}
