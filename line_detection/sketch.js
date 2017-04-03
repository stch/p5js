
var img

function setup() {
  // create canvas
  var c = createCanvas(screen.width, screen.height);
  background(100);
  fill(255);
  noStroke();
  textSize(24);
  textAlign(CENTER);
  text('Drag an image file onto the canvas.', width/2, height/2);

  // Add an event for when a file is dropped onto the canvas
  c.drop(gotFile);
}

function draw() {
  clear()
  // Draw the image onto the canvas
  if(img){
    image(img, 0, 0, width/2, 0.5*width*img.height/img.width);
  }

}

function gotFile(file) {
  // If it's an image file
  if (file.type === 'image') {
    // Create an image DOM element but don't show it
    img = createImg(file.data).hide();
  } else {
    println('Not an image file!');
  }
}
