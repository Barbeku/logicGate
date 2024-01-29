const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

window.onresize = () => {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
}
window.onresize();

var zoom = 1;
var zoomStep = 0.01;

let isDrawingLine = false;
let drawingLineFrom = {x: 0, y: 0};
let cursorPosition = {x: 0, y: 0};

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
  context.clearRect(0, 0, innerWidth, innerHeight);
}

function addItem(name, x, y, width, height, color, connects){
  let newItem = {
    name, x, y, width, height, color, connects
  }

  items.push(newItem);
}

function drawItems(){
  for(let i = 0; i < items.length; i++){
    let item = items[i];

    let color = item.color;
    if(item.isLight){
      color = 'purple';
    }

    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.fillRect(item.x, item.y, item.width, item.height);
    ctx.closePath();

    for(let i = 0; i < item.connects.length; i++){
      let connect = item.connects[i];

      ctx.beginPath();
      ctx.fillStyle = (connect.to == null) ? "black" : "gray";
      ctx.fillRect(item.x + connect.x, item.y + connect.y, connect.w, connect.h);
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

        ctx.moveTo(item.x + connect.x + connect.w / 2, item.y + connect.y + connect.h / 2);
        ctx.lineTo(itemTo.x + connectTo.x + connectTo.w / 2, itemTo.y + connectTo.y + connectTo.h / 2);
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
      item.x < x && item.x + item.width > x &&
      item.y < y && item.y + item.height > y
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
        item.x + connect.x < x && item.x + connect.x + connect.w > x &&
        item.y + connect.y < y && item.y + connect.y + connect.h > y
      ){
        return [i, j];
      }
    }
  }
  return false;
}


document.addEventListener("contextmenu", e => e.preventDefault());

document.addEventListener("mousedown", event => {
  if(event.button === 2){
    let x = event.clientX;
    let y = event.clientY;

    let index = getIndexItemByCord(x, y);

    if(index == undefined) return;

    let relX = x - items[index].x;
    let relY = y - items[index].y;

    document.addEventListener("mousemove", mouseMove);
    document.addEventListener("mouseup", mouseUp);

    function mouseMove(mouseDownEvent){
      let x = mouseDownEvent.clientX;
      let y = mouseDownEvent.clientY;

      items[index].x = x - relX;
      items[index].y = y - relY;
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

    if(connectFromPos === false) return;

    let connectFrom = items[connectFromPos[0]].connects[connectFromPos[1]];

    if(!connectFrom.to) return;

    isDrawingLine = true;
    drawingLineFrom.x = items[connectFromPos[0]].x + connectFrom.x + connectFrom.w / 2;
    drawingLineFrom.y = items[connectFromPos[0]].y + connectFrom.y + connectFrom.h / 2;

    cursorPosition.x = event.clientX;
    cursorPosition.y = event.clientY;

    document.addEventListener("mousemove", mouseMove);
    function mouseMove(event){
      cursorPosition.x = event.clientX;
      cursorPosition.y = event.clientY;
    }

    document.addEventListener("mouseup", event => {
      document.removeEventListener("mousemove", mouseMove);
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
      items[connect.from[0]].connects[connect.from[1]].to = "none";
      connect.from = "none";
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

  let height = 80;
  let width = 50;

  let connectsCount = 3;

  switch(name){
    case "OR":
      color = "#def"
      x = 0;
      break;
    case "AND":
      color = "#ddd";
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
      {name: "in1", x: 10, y: 10, w: 10, h: 10, run: 0, from: 'none'},
      {name: "in2", x: 10, y: 50, w: 10, h: 10, run: 0, from: 'none'},
      {name: "out", x: 30, y: 25, w: 10, h: 10, to: 'none', run: 0},
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
  console.log(item);


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
  if(event.deltaY === -100){
    zoom -= zoomStep;
  }
  else if(event.deltaY === 100){
    zoom += zoomStep;
  }
  console.log(zoom);
});
