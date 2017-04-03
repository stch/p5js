
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

     //image(img, 0, 0, img.width, img.height);
     //loadPixels()
  } else {
    println('Not an image file!');
  }
}

function draw() {
  //background(100);
  //clear()
  // Draw the image onto the canvas
  if(img){
    //image(img, 0, 0, width*0.5, 0.5*img.height*width/img.width);
    image(img, 0, 0, img.width, img.height);

  }else{
    fill(255);
    noStroke();
    textSize(24);
    textAlign(CENTER);
    text('Drag an image file onto the canvas.', width/2, height/2);
  }
}
