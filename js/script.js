const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

window.onresize = () => {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
}
window.onresize();

var zoom = 1;
var zoomStep = 0.06;

let isDrawingLine = false;
let drawingLineFrom = {x: 0, y: 0};
let cursorPosition = {x: 0, y: 0};

var moveY = 0;
var moveX = 0;

var items = [];

var schemesBlock = document.getElementById("schemes");

var schemesCount;
for(schemesCount = 0; localStorage.getItem(`scheme${schemesCount}`); schemesCount++){
  schemesBlock.insertAdjacentHTML(
    'beforeend',
    `<span class="scheme">${schemesCount}</span>`,
  )
}

function clearRect(context = ctx){
  context.fillStyle = "white";
  context.fillRect(0, 0, innerWidth, innerHeight);
}

function addItem(name, x, y, width, height, color, connects){
  let newItem = {
    name, x, y, width, height, color, connects
  }

  items.push(newItem);
}

let k = 0.922;
function drawItems(){
  for(let i = 0; i < items.length; i++){
    let item = items[i];

    let color = item.color;
    if(item.isLight){
      color = 'purple';
    }

    if(item.name.includes("AND") && !item.name.includes("EX")){
      ctx.beginPath();

      let radius = item.height / 2;

      ctx.arc(
        (item.x * zoom + item.width * zoom - radius / 2) + moveX,
        (item.y + radius) * zoom + moveY,
        radius * zoom,
        -1, 1
      );
      ctx.lineTo(
        item.x * zoom + moveX,
        (item.y + item.height * k) * zoom + moveY
      );

      ctx.arc(
        (item.x - radius / 2) * zoom + moveX,
        (item.y + radius) * zoom + moveY,
        radius * zoom,
        1, -1, true

      );

      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    }
    else if(item.name.includes("OR") && !item.name.includes("EX")){
      ctx.beginPath();

      let radius = item.height / 2;

      ctx.arc(
        (item.x + item.width - radius / 2) * zoom + moveX,
        (item.y + radius) * zoom + moveY,
        radius * zoom,
        -1, 1
      );
      ctx.lineTo(
        item.x * zoom + moveX,
        (item.y + item.height * k) * zoom + moveY
      );
      ctx.lineTo(
        item.x * zoom + moveX,
        (item.y + item.height - item.height * k) * zoom + moveY
      );

      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    }
    else{
      ctx.beginPath();
      ctx.fillStyle = color;
      ctx.fillRect(
        item.x * zoom + moveX,
        item.y * zoom + moveY,
        item.width * zoom,
        item.height * zoom
      );
      ctx.closePath();
    }

    for(let i = 0; i < item.connects.length; i++){
      let connect = item.connects[i];

      ctx.beginPath();
      ctx.fillStyle = (connect.to == null) ? "black" : "gray";
      ctx.fillRect(
        (item.x + connect.x) * zoom + moveX,
        (item.y + connect.y) * zoom + moveY,
        connect.w * zoom,
        connect.h * zoom
      );
      ctx.closePath();
    }
  }

  for(let i = 0; i < items.length; i++){
    let item = items[i];
    ctx.beginPath();

    for(let i = 0; i < item.connects.length; i++){
      let connect = item.connects[i];

      if(connect.to !== "none" && connect?.to){
        let connectTo = items[connect.to[0]].connects[connect.to[1]];

        let itemTo = items[connect.to[0]];

        ctx.moveTo(
          (item.x + connect.x + connect.w / 2) * zoom + moveX,
          (item.y + connect.y + connect.h / 2) * zoom + moveY
        );
        ctx.lineTo(
          (itemTo.x + connectTo.x + connectTo.w / 2) * zoom + moveX,
          (itemTo.y + connectTo.y + connectTo.h / 2) * zoom + moveY
        );
        ctx.stroke();
      }
    }

    ctx.closePath();
  }
}

function getIndexItemByCord(x, y){
  for(let i = items.length - 1; i >= 0; i--){
    let item = items[i];
    if(
      (item.x * zoom + moveX) < x && (item.x * zoom + item.width * zoom) + moveX > x &&
      (item.y * zoom + moveY) < y && (item.y * zoom + item.height * zoom) + moveY > y
    ){
      return i;
    }
  }
}

function getConnectByCord(x, y){
  for(let i = items.length - 1; i >= 0; i--){
    let item = items[i];

    if(!item?.connects) return false;

    for(let j = 0; j < item.connects.length; j++){
      let connect = item.connects[j];
      if(
        (item.x + connect.x) * zoom + moveX < x && (item.x + connect.x + connect.w) * zoom + moveX > x &&
        (item.y + connect.y) * zoom + moveY < y && (item.y + connect.y + connect.h) * zoom + moveY > y
      ){
        return [i, j];
      }
    }
  }
  return false;
}


document.addEventListener("contextmenu", e => e.preventDefault());

document.addEventListener("mousedown", event => {
  if(event.ctrlKey){
    let copyMoveY = moveY;
    let copyMoveX = moveX;

    let x = event.clientX;
    let y = event.clientY;

    document.addEventListener("mousemove", mouseMove);

    function mouseMove(event){
      let mx = event.clientX;
      let my = event.clientY;

      moveY = copyMoveY - y + my;
      moveX = copyMoveX - x + mx;
    }

    document.addEventListener("mouseup", () => {
      document.removeEventListener("mousemove", mouseMove);
    }, { once: true });
  }
  else if(event.button === 2){
    let x = event.clientX;
    let y = event.clientY;

    let index = getIndexItemByCord(x, y);

    if(index == undefined) return;

    let relX = Math.abs((items[index].x) * zoom + moveX - x) / (items[index].width * zoom);
    let relY = Math.abs((items[index].y) * zoom + moveY - y) / (items[index].height * zoom);
    
    document.addEventListener("mousemove", mouseMove);
    document.addEventListener("mouseup", mouseUp);

    function mouseMove(mouseDownEvent){
      let x = mouseDownEvent.clientX - moveX;
      let y = mouseDownEvent.clientY - moveY;

      items[index].x = (x / zoom) - (items[index].width * relX);
      items[index].y = (y / zoom) - (items[index].height * relY);
    }

    function mouseUp(){
      document.removeEventListener("mousemove", mouseMove);
      document.removeEventListener("mouseup", mouseUp);
    }
  }
  else if(event.button === 0){
    let x = event.clientX;
    let y = event.clientY;

    let connectFromPos = getConnectByCord(x, y);
    console.log(connectFromPos);


    if(connectFromPos === false) return;

    let connectFrom = items[connectFromPos[0]].connects[connectFromPos[1]];

    if(!connectFrom.to) return;

    isDrawingLine = true;
    drawingLineFrom.x = (items[connectFromPos[0]].x + connectFrom.x + connectFrom.w / 2) * zoom + moveX;
    drawingLineFrom.y = (items[connectFromPos[0]].y + connectFrom.y + connectFrom.h / 2) * zoom + moveY;


    document.addEventListener("mouseup", event => {
      isDrawingLine = false;

      let x = event.clientX;
      let y = event.clientY;

      let connectToPos = getConnectByCord(x, y);

      if(connectToPos === false) return;

      let connectTo = items[connectToPos[0]].connects[connectToPos[1]];

      if(connectTo.to) return;
      if(items[connectToPos[0]] == items[connectFromPos[0]]) return;

      console.log(connectTo);

      connectTo.from = connectFromPos;
      connectFrom.to = connectToPos;

    }, { once: true })

  }
  else if(event.button === 1){
    let x = event.clientX;
    let y = event.clientY;

    let connectPos = getConnectByCord(x, y);

    if(!connectPos) return;

    let connect = items[connectPos[0]].connects[connectPos[1]];

    let secondConnect;

    if(connect.from){
      items[connect.from[0]].connects[connect.from[1]].to = "none"; connect.from = "none";
    }
    else if(connect.to){
      items[connect.to[0]].connects[connect.to[1]].from = "none";
      connect.to = "none";
    }
  }
})

function loop(){
  clearRect();
  drawItems();

  if(isDrawingLine){
    ctx.moveTo(drawingLineFrom.x, drawingLineFrom.y);
    ctx.lineTo(cursorPosition.x, cursorPosition.y);
    ctx.stroke();
  }

  window.requestAnimationFrame(loop);
}
window.requestAnimationFrame(loop);


function createElement(name){
  let i = 0;
  let color = "white";

  let x = 0;

  let height = 70;
  let width = 70;

  let connectsCount = 3;

  switch(name){
    case "OR":
      color = "#def"
      x = 0;
      break;
    case "AND":
      color = "#8df";
      x = 100;
      break;
    case "EX-AND":
      x = 600;
      color = "purple";
      break;
    case "NOT":
      x = 300;
      color = "#222";
      width = 70;
      height = 40;
      return () => {
        addItem(`${name}${i}`, x, (height + 2) * i, width, height, color, [
          {name: "in1", x: 10, y: height / 2 - 5, w: 10, h: 10, run: 0, from: 'none'},
          {name: "out", x: width - 10, y: height / 2 - 5, w: 10, h: 10, to: 'none', run: 0},
        ]);
        i++;
      }

      break;
    case "DSOURCE":
      x = 500;
      width = height = 60;
      color = "#111";
      return () => {
        addItem(`${name}${i}`, x, (height + 2) * i, width, height, color, [
          {name: "out", x: 30, y: 25, w: 10, h: 10, to: 'none', run: 0},
        ]);
        i++;
      }
      break;
    case "SOURCE":
      x = 200;
      width = height = 60;
      color = "red";
      return () => {
        addItem(`${name}${i}`, x, (height + 2) * i, width, height, color, [
          {name: "out", x: 30, y: 25, w: 10, h: 10, to: 'none', run: 1},
        ]);
        i++;
      }
      break;
    case "LIGHT":
      x = 400;
      width = height = 40;
      color = "yellow";
      return () => {
        addItem(`${name}${i}`, x, (height + 2) * i, width, height, color, [
          {name: "in1", x: 10, y: 12, w: 10, h: 10, run: 0, from: 'none'},
        ]);
        i++;
      }
      break;
    case "TREE":
      x = 700;
      color = "blue";
      width = 70;
      height = 40;

      return () => {
        addItem(`${name}${i}`, x, (height + 2) * i, width, height, color, [
          {name: "in1", x: 10, y: 12, w: 10, h: 10, run: 0, from: 'none'},
          {name: "out1", x: width - 10, y: 0, w: 10, h: 10, run: 0, to: 'none'},
          {name: "out2", x: width - 10, y: height - 10, w: 10, h: 10, run: 0, to: 'none'},
        ]);
        i++;
      }
      break;
  }


  return () => {
    addItem(`${name}${i}`, x, (height + 2) * i, width, height, color, [
      {name: "in1", x: 25, y: 15, w: 10, h: 10, run: 0, from: 'none'},
      {name: "in2", x: 25, y: height - 25, w: 10, h: 10, run: 0, from: 'none'},
      {name: "out", x: width, y: height / 2 - 5, w: 10, h: 10, to: 'none', run: 0},
    ]);
    i++;
  }
}

const createAnd = createElement("AND");
const createExAnd = createElement("EX-AND");
const createOr = createElement("OR");
const createSource = createElement("SOURCE");
const createDisactiveSouce = createElement("DSOURCE");
const createNot = createElement("NOT");
const createLight = createElement("LIGHT");
const createTree = createElement("TREE");


document.addEventListener('keydown', event => {
  if(event.code.toLowerCase() === 'space'){
    for(let i = 0; i < items.length; i++){
      if(items[i].name.includes("LIGHT")){
        isWork(i);
      }
    }
  }
  else if(event.code.toLowerCase() === 'keys'){
    localStorage.setItem(`scheme${schemesCount}`, JSON.stringify(items));
  }
  else if(event.code.toLowerCase() === 'keyo'){
    schemesBlock.toggleAttribute("open");
  }
  else if(event.code.toLowerCase() === 'keyf'){
    if(document.fullscreenElement){
      document.exitFullscreen();
    }
    else{
      canvas.requestFullscreen();
    }
  }

  switch(event.key){
    case '1':
      createSource();
      break;
    case '2':
      createDisactiveSouce();
      break;
    case '3':
      createAnd();
      break;
    case '4':
      createOr();
      break;
    case '5':
      createNot();
      break;
    case '6':
      createExAnd();
      break;
    case '7':
      createLight();
      break;
    case '0':
      createTree();
      break;
  }
})

function isWork(itemIndex){
  if(itemIndex === 'n') return 0;

  let item = items[itemIndex];

  if(item.name.includes("LIGHT")){
    let sourceElementPos = item.connects[0].from;
    let sourceElement = items[sourceElementPos[0]];

    let result = isWork(sourceElementPos[0]);

    if(result === 1) item.isLight = 1;
    else item.isLight = 0;

    return result;
  }
  else if(item.name.includes("NOT")){
    let in1 = item.connects[0].from;

    return isWork(in1[0]) === 1 ? 0 : 1;
  }
  else if(item.name.includes("OR")){
    let in1 = item.connects[0].from;
    let in2 = item.connects[1].from;

    return isWork(in1[0]) & isWork(in2[0]);
  }
  else if(item.name.includes("EX-AND")){
    let in1 = item.connects[0].from;
    let in2 = item.connects[1].from;

    return isWork(in1[0]) ^ isWork(in2[0]);
  }
  else if(item.name.includes("AND")){
    let in1 = item.connects[0].from;
    let in2 = item.connects[1].from;

    return isWork(in1[0]) | isWork(in2[0]);
  }
  else if(item.name.includes("DSOURCE")){
    return 0;
  }
  else if(item.name.includes("SOURCE")){
    return 1;
  }
  else if(item.name.includes("TREE")){
    let in1 = item.connects[0].from;

    return isWork(in1[0]);
  }
}


document.addEventListener("click", ({target}) => {
  if(!target.closest(".scheme")) return;

  items = JSON.parse(localStorage.getItem(`scheme${target.textContent.trim()}`));

  schemesBlock.toggleAttribute("open");
})

document.addEventListener("mousewheel", event => {
  let center = {
    x: (innerWidth / 2),
    y: (innerHeight / 2),
  };
  let k = .1;
  
  if(event.deltaY === -100){
    zoom += zoomStep;
    moveX -= (cursorPosition.x - center.x) * k;
    moveY -= (cursorPosition.y - center.y) * k;
  }
  else if(event.deltaY === 100){
    zoom -= zoomStep;
    moveX += (cursorPosition.x - center.x) * k;
    moveY += (cursorPosition.y - center.y) * k;
  }
});

document.addEventListener("mousemove", mouseMove);
function mouseMove(event){
  cursorPosition.x = event.clientX;
  cursorPosition.y = event.clientY;
}

//createAnd();



//test!!!!!!!!!!!!!!!!!!!!!!!!!!!!
//items = JSON.parse(localStorage.getItem("scheme2"));
