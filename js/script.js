//TODO: сделать нормальным, а потом крутые проекты пытатся делать
//TODO: удаление объектов и добавление их в корзину, переработка всех движений, подборка нормальных цветов, нормальное сохранение, ограничение зума
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

function createMark(name){
  let i = 0;

  return () => {
    console.log(`${name}${i++}`);
  }
}

const mark = createMark('work');

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

var isDrawingAllWires = true;

var items = [];

var isMultiSelect = false;
var startMultiSelectFrom = {x: 0, y: 0};
var itemsInMultiSelect = [];

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

  return newItem;
}

let k = 0.922;
function drawItems(){
  for(let i = 0; i < items.length; i++){
    let item = items[i];

    let color = item.color;
    if(item.isLight){
      color = 'purple';
    }

    if(item.name.includes("AND") && !item.name.includes("EX") && !item.name.includes("MEGA")){
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

  if(isDrawingAllWires === false) return;
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

  if(isMultiSelect){
    ctx.beginPath();
    ctx.rect(
      startMultiSelectFrom.x,
      startMultiSelectFrom.y,
      cursorPosition.x - startMultiSelectFrom.x,
      cursorPosition.y - startMultiSelectFrom.y,
    );
    ctx.setLineDash([5, 15]);
    ctx.stroke();
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

      let item = items[connectToPos[0]];

      let connectTo = items[connectToPos[0]].connects[connectToPos[1]];

      console.log(connectFromPos);
      if(item.name.includes("LIGHT")){
        console.log(item.connects[0]);
        item.connects[0].from.push(connectFromPos);

        connectFrom.to = connectToPos;
        return;
      }

      if(connectTo.to) return;
      if(items[connectToPos[0]] == items[connectFromPos[0]]) return;

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
  startToque();
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
  var i = 0;
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
      color = "#aaa";
      width = 70;
      height = 40;
      return () => {
        return addItem(`${name}${i}`, x, (height + 2) * i, width, height, color, [
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
        return addItem(`${name}${i}`, x, (height + 2) * i, width, height, color, [
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
        return addItem(`${name}${i}`, x, (height + 2) * i, width, height, color, [
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
        return addItem(`${name}${i}`, x, (height + 2) * i, width, height, color, [
          {name: "in1", x: 10, y: 12, w: 10, h: 10, run: 0, from: []},
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
        return addItem(`${name}${i}`, x, (height + 2) * i, width, height, color, [
          {name: "in1", x: 10, y: 12, w: 10, h: 10, run: 0, from: 'none'},
          {name: "out1", x: width - 10, y: 0, w: 10, h: 10, run: 0, to: 'none'},
          {name: "out2", x: width - 10, y: height - 10, w: 10, h: 10, run: 0, to: 'none'},
        ]);
        i++;
      }
      break;
    case "MEGATREE":
      x = 800;
      color = "green";
      width = 70;
      height = 85;

      return () => {
        return addItem(`${name}${i}`, x, (height + 2) * i, width, height, color, [
          {name: "in1", x: 10, y: height / 2 - 5, w: 10, h: 10, run: 0, from: 'none'},
          {name: "out1", x: width - 10, y: 0, w: 10, h: 10, run: 0, to: 'none'},
          {name: "out2", x: width - 10, y: 15, w: 10, h: 10, to: 'none'},
          {name: "out3", x: width - 10, y: 30, w: 10, h: 10, to: 'none'},
          {name: "out4", x: width - 10, y: 45, w: 10, h: 10, to: 'none'},
          {name: "out5", x: width - 10, y: 60, w: 10, h: 10, to: 'none'},
          {name: "out4", x: width - 10, y: 75, w: 10, h: 10, to: 'none'},
        ]);
        i++;
      }
      break;
    case "MEGAAND":
      x = 900;
      color = "brown";
      width = 70;
      height = 85;

      return () => {
        return addItem(`${name}${i}`, x, (height + 2) * i, width, height, color, [
          {name: "in1", x: 10, y: 0, w: 10, h: 10, run: 0, from: 'none'},
          {name: "in2", x: 10, y: 15, w: 10, h: 10, run: 0, from: 'none'},
          {name: "in3", x: 10, y: 30, w: 10, h: 10, from: 'none'},
          {name: "in4", x: 10, y: 45, w: 10, h: 10, from: 'none'},
          {name: "in5", x: 10, y: 60, w: 10, h: 10, from: 'none'},
          {name: "in6", x: 10, y: 75, w: 10, h: 10, from: 'none'},
          {name: "out", x: width - 20, y: height / 2 - 15, w: 10, h: 10, to: 'none'},
        ]);
        i++;
      }
      break;
  }


  return () => {
    return addItem(`${name}${i}`, x, (height + 2) * i, width, height, color, [
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
const createMegaTree = createElement("MEGATREE");
const createMegaAnd = createElement("MEGAAND");


function startToque(){
  for(let i = 0; i < items.length; i++){
    if(items[i].name.includes("LIGHT")){
      isWork(i);
    }
  }
}

document.addEventListener('keydown', event => {
  if(event.code.toLowerCase() === 'slash'){
    isDrawingAllWires = !isDrawingAllWires;
  }
  else if(event.code.toLowerCase() === 'keyt'){
    let index = getIndexItemByCord(cursorPosition.x, cursorPosition.y);

    if(!index) return;

    let item = items[index];
    console.log(item);

    if(item.name.includes("DSOURCE")){
      item.name = "SOURCE";
      item.color = "red";
    }
    else if(item.name.includes("SOURCE")){
      item.name = "DSOURCE";
      item.color = "#111";
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
    case '8':
      createMegaTree();
      break;
    case '9':
      createMegaAnd();
      break;
    case '0':
      createTree();
      break;
  }
})

function isWork(itemIndex){
  if((typeof itemIndex) === 'string' || itemIndex === undefined) return 0;

  let item = items[itemIndex];


  if(item.name.includes("LIGHT")){
    let array = item.connects[0].from;

    for(let i = 0; i < array.length; i++){
      if(isWork(array[i][0])){
        item.isLight = 1;
        return 1;
      }
    }
    item.isLight = 0;
    return 0;

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
  else if(item.name.includes("MEGAAND")){
    for(let i = 0; i < 6; i++){
      if(isWork(item.connects[i].from[0])){
        return 1;
      }
    }
    return 0;
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
    let in1 = item.connects[0].from;
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
  let t = 250;

  let cursorX = (cursorPosition.x > center.x) ? cursorPosition.x + t : cursorPosition.x;
  let cursorY = (cursorPosition.y > center.y) ? cursorPosition.y + t : cursorPosition.y;
  
  if(event.deltaY === -100){
    zoom += zoomStep;
    moveX -= (cursorX - center.x) * k;
    moveY -= (cursorY - center.y) * k;
  }
  else if(event.deltaY === 100){
    zoom -= zoomStep;
    moveX += (cursorX - center.x) * k;
    moveY += (cursorY - center.y) * k;
  }
});

document.addEventListener("mousemove", mouseMove);
function mouseMove(event){
  cursorPosition.x = event.clientX;
  cursorPosition.y = event.clientY;
}

document.addEventListener("click", () => {
  let isOverTime = false;

  document.addEventListener("mousedown", mouseDown);

  setTimeout(() => {
    isOverTime = true;
    document.removeEventListener("mousedown", mouseDown);
  }, 200)

  function mouseDown(event){
    isMultiSelect = true;

    startMultiSelectFrom.x = event.clientX;
    startMultiSelectFrom.y = event.clientY;
    document.addEventListener("mouseup", mouseUp, { once: true });


    function mouseUp(mouseUpEvent){
      itemsInMultiSelect = [];
      isMultiSelect = false; //убрать бы
      let x = mouseUpEvent.clientX;
      let y = mouseUpEvent.clientY;
      mark();

      //в один прямоугольник превратить выделение и так чекать вхождение в него
      for(item of items){
        if(
          (item.x > startMultiSelectFrom.x) &&
          ((item.x + item.width) < x) &&
          (item.y > startMultiSelectFrom.y) &&
          ((item.y + item.height) < y)
          ||
          ((item.x + item.width) < startMultiSelectFrom.x) &&
          (item.x > x) &&
          ((item.y + item.height) > startMultiSelectFrom.y) &&
          (item.y < y)
        ){
          console.log(item);
          itemsInMultiSelect.push(item);
        }
      }
    }
  }
})


/*
for(let i = 0; i < 7; i++){
  for(let j = 0; j < 51; j++){
    let item = createMegaTree();
    item.x = 900 + i * 100;
    item.y = j * 87;
  }
}
*/

/*
for(let i = 0; i < items.length; i++){
  let item = items[i];

  if(item.name.includes("MEGATREE")){
    if(item.connects[6].to === 'none'){
      item.connects[6].to === [i + 1, 0];
      items[i + 1].connects[0].from = [i, 6]
    }
  }
}
*/

/*
for(let j = 0; j < 12; j++){

  for(let i = 0; i < 5; i++){
    let item = createLight();
    item.x = 2550 + j * 50;
    item.y = i * 50;
  }
}
*/

