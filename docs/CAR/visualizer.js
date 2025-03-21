//init below!

class Visualizer {
    static network = null;
    static segments = [];
    static points = [];
    static highlightedSegment = null;
    static highlightedPoint = null;
    static selectedBiases = [];
    static selectedInputs = [];
    static selectedWeights = [];
    static decisionBoundary = null;
    static mouse = { x: 0, y: 0 };
 
    static handleMouseMove(evt) {
       Visualizer.mouse = { x: evt.offsetX, y: evt.offsetY };
 
       const rad = 10;
       Visualizer.highlightedPoint = getNearestPoint(
          Visualizer.mouse,
          Visualizer.inputPoints,
          rad * 1.7
       );
       if (
          !Visualizer.highlightedPoint ||
          Visualizer.highlightedPoint.levelIndex != 0
       ) {
          Visualizer.highlightedPoint = getNearestPoint(
             Visualizer.mouse,
             Visualizer.points,
             rad * 1.7
          );
       }
       if (!Visualizer.highlightedPoint) {
          Visualizer.highlightedSegment = getNearestSegment(
             Visualizer.mouse,
             Visualizer.segments,
             rad
          );
       } else {
          Visualizer.highlightedSegment = null;
       }
    }
    static addEventListeners(canvas) {
       //canvas.addEventListener("mousedown", this.boundHandleMouseDown);
       canvas.addEventListener("mousemove", Visualizer.handleMouseMove);
       canvas.addEventListener("mousedown", (evt) => {
          if (Visualizer.highlightedPoint) {
             const point = Visualizer.highlightedPoint;
             if (point.inputNode) {
                if (Visualizer.selectedInputs.find((p) => point.equals(p))) {
                   for (let i = 0; i < Visualizer.selectedInputs.length; i++) {
                      if (point.equals(Visualizer.selectedInputs[i])) {
                         if (Visualizer.selectedInputs.length > 2) {
                            Visualizer.selectedInputs.splice(i, 1);
                            break;
                         }
                      }
                   }
                } else {
                   Visualizer.selectedInputs.push(point);
                }
                Visualizer.decisionBoundary.updateBrain(Visualizer.network);
                save();
             } else {
                if (Visualizer.selectedBiases.find((p) => point.equals(p))) {
                   for (let i = 0; i < Visualizer.selectedBiases.length; i++) {
                      if (point.equals(Visualizer.selectedBiases[i])) {
                         Visualizer.selectedBiases.splice(i, 1);
                         break;
                      }
                   }
                } else {
                   Visualizer.selectedBiases.push(point);
                }
                save();
             }
          }
          if (Visualizer.highlightedSegment) {
             const seg = Visualizer.highlightedSegment;
             if (Visualizer.selectedWeights.find((s) => seg.equals(s))) {
                for (let i = 0; i < Visualizer.selectedWeights.length; i++) {
                   if (seg.equals(Visualizer.selectedWeights[i])) {
                      Visualizer.selectedWeights.splice(i, 1);
                      break;
                   }
                }
             } else {
                Visualizer.selectedWeights.push(seg);
             }
          }
          localStorage.setItem(
             "selectedWeightsAndBiases",
             JSON.stringify({
                weights: Visualizer.selectedWeights,
                biases: Visualizer.selectedBiases,
                inputs: Visualizer.selectedInputs,
             })
          );
       });
       document.addEventListener("keydown", function (event) {
          const key = event.key;
          const shiftKey = event.shiftKey;
          // Check if the pressed key is a number (0-9) or Shift+number
          let value = NaN;
          switch (key) {
             case "!":
                value = -0.1;
                break;
             case "@":
                value = -0.2;
                break;
             case "#":
                value = -0.3;
                break;
             case "$":
                value = -0.4;
                break;
             case "%":
                value = -0.5;
                break;
             case "^":
                value = -0.6;
                break;
             case "&":
                value = -0.7;
                break;
             case "*":
                value = -0.8;
                break;
             case "(":
                value = -0.9;
                break;
             case ")":
                value = 0;
                break;
          }
          if (!shiftKey && key >= "0" && key <= "9") {
             // Log the state to the console
             value = key / 10;
          }
 
          if (isNaN(value)) {
             return;
          }
 
          if (Visualizer.highlightedPoint) {
             const { levelIndex, index } = Visualizer.highlightedPoint;
             Visualizer.network.levels[levelIndex].biases[index] = value;
          }
          if (Visualizer.highlightedSegment) {
             const { levelIndex, indices } = Visualizer.highlightedSegment;
             Visualizer.network.levels[levelIndex].weights[indices[0]][
                indices[1]
             ] = value;
          }
          try {
             save();
             decisionBoundaries[0].updateBrain(Visualizer.network);
          } catch (err) {}
       });
 
       canvas.addEventListener("mousewheel", (evt) => {
          const dir = Math.sign(evt.deltaY);
          const step = evt.shiftKey?-0.01:-0.1;
          if (Visualizer.highlightedPoint) {
             if (Visualizer.highlightedPoint.inputNode) {
                const { levelIndex, index } = Visualizer.highlightedPoint;
                Visualizer.decisionBoundary.defaultValues[index] += dir * step;
                Visualizer.decisionBoundary.defaultValues[index] = Math.max(
                   -1,
                   Math.min(1, Visualizer.decisionBoundary.defaultValues[index])
                );
             } else {
                const { levelIndex, index } = Visualizer.highlightedPoint;
 
                Visualizer.network.levels[levelIndex].biases[index] +=
                   dir * step;
                Visualizer.network.levels[levelIndex].biases[index] = Math.max(
                   -1,
                   Math.min(
                      1,
                      Visualizer.network.levels[levelIndex].biases[index]
                   )
                );
             }
          }
          if (Visualizer.highlightedSegment) {
             const { levelIndex, indices } = Visualizer.highlightedSegment;
             console.log(levelIndex, indices);
             Visualizer.network.levels[levelIndex].weights[indices[0]][
                indices[1]
             ] += dir * step;
             Visualizer.network.levels[levelIndex].weights[indices[0]][
                indices[1]
             ] = Math.max(
                -1,
                Math.min(
                   1,
                   Visualizer.network.levels[levelIndex].weights[indices[0]][
                      indices[1]
                   ]
                )
             );
          }
          try {
             save();
             decisionBoundaries[0].updateBrain(Visualizer.network);
          } catch (err) {}
       });
 
       //canvas.addEventListener("contextmenu", this.boundPreventContextMenu);
    }
    static drawNetwork(
       ctx,
       network,
       outputLabels = [],
       outputColors = [],
       inputLabels = [],
       inputColors = []
    ) {
       Visualizer.network = network;
       Visualizer.segments = [];
       Visualizer.points = [];
       Visualizer.inputPoints = [];
       const margin = 50;
       const left = margin;
       const top = margin;
       const width = ctx.canvas.width - margin * 2;
       const height = ctx.canvas.height - margin * 2;
 
       const levelHeight = height / network.levels.length;
 
       const nodeRadius = 23;
       ctx.strokeStyle = "rgba(200,50,50,1)";
       ctx.fillStyle = "rgba(200,50,50,1)";
       ctx.lineWidth = 9;
       ctx.setLineDash([]);
       for (const seg of Visualizer.selectedWeights) {
          ctx.save();
          const p1 = seg.p1;
          const p2 = seg.p2;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y); //Visualizer.getNodeX(inputs, i, left, right), bottom);
          ctx.lineTo(p2.x, p2.y); //Visualizer.getNodeX(outputs, j, left, right), top);
          ctx.stroke();
          ctx.restore();
       }
       for (const point of Visualizer.selectedBiases) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(point.x, point.y, nodeRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
       }
       ctx.strokeStyle = "rgba(200,200,200,1)";
       ctx.fillStyle = "rgba(200,200,200,1)";
       if (Visualizer.highlightedSegment) {
          ctx.save();
          const p1 = Visualizer.highlightedSegment.p1;
          const p2 = Visualizer.highlightedSegment.p2;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y); //Visualizer.getNodeX(inputs, i, left, right), bottom);
          ctx.lineTo(p2.x, p2.y); //Visualizer.getNodeX(outputs, j, left, right), top);
          ctx.stroke();
          ctx.restore();
       }
 
       if (Visualizer.highlightedPoint) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(
             Visualizer.highlightedPoint.x,
             Visualizer.highlightedPoint.y,
             nodeRadius,
             0,
             Math.PI * 2
          );
          ctx.fill();
          ctx.restore();
       }
       ctx.strokeStyle = "rgba(200,200,200,1)";
       ctx.fillStyle = "rgba(200,200,200,1)";
       for (const point of Visualizer.selectedInputs) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(point.x, point.y, nodeRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
       }
 
       for (let i = network.levels.length - 1; i >= 0; i--) {
          const levelTop =
             top +
             lerp(
                height - levelHeight,
                0,
                network.levels.length == 1
                   ? 0.5
                   : i / (network.levels.length - 1)
             );
 
          ctx.setLineDash([7, 3]);
          Visualizer.drawLevel(
             ctx,
             network.levels[i],
             left,
             levelTop,
             width,
             levelHeight,
             i == network.levels.length - 1 ? outputLabels : [],
             i,
             outputColors,
             i == 0 ? inputLabels : []
          );
       }
 
       const rad = 15;
       if (Visualizer.highlightedSegment || Visualizer.highlightedPoint) {
          ctx.save();
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.fillStyle = "black";
          ctx.strokeStyle = "white";
          ctx.rect(Visualizer.mouse.x, Visualizer.mouse.y - rad, rad, rad);
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.arc(
             Visualizer.mouse.x + rad,
             Visualizer.mouse.y - rad,
             rad,
             0,
             Math.PI * 2
          );
          ctx.fill();
 
          const val = Visualizer.highlightedSegment
             ? Visualizer.network.levels[
                  Visualizer.highlightedSegment.levelIndex
               ].weights[Visualizer.highlightedSegment.indices[0]][
                  Visualizer.highlightedSegment.indices[1]
               ]
             : Visualizer.highlightedPoint.inputNode
             ? Visualizer.network.levels[Visualizer.highlightedPoint.levelIndex]
                  .inputs[Visualizer.highlightedPoint.index]
             : Visualizer.network.levels[Visualizer.highlightedPoint.levelIndex]
                  .biases[Visualizer.highlightedPoint.index];
          ctx.fillStyle = "white";//getRGBA(val);
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.font = "bold "+(rad * 0.8) + "px Arial";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.fillText(
             val==null?0:val.toFixed(2),
             Visualizer.mouse.x + rad,
             Visualizer.mouse.y - rad
          );/*
          ctx.strokeText(
             val.toFixed(2),
             Visualizer.mouse.x + rad,
             Visualizer.mouse.y - rad
          );*/
 
          ctx.restore();
       }
    }
 
    static drawLevel(
       ctx,
       level,
       left,
       top,
       width,
       height,
       outputLabels,
       levelIndex,
       outputColors,
       inputLabels
    ) {
       const right = left + width;
       const bottom = top + height;
 
       const nodeRadius = 18;
 
       const { inputs, outputs, weights, biases } = level;
 
       for (let i = 0; i < inputs.length; i++) {
          for (let j = 0; j < outputs.length; j++) {
             ctx.beginPath();
             const p1 = new Point(
                Visualizer.getNodeX(inputs, i, left, right),
                bottom
             );
             const p2 = new Point(
                Visualizer.getNodeX(outputs, j, left, right),
                top
             );
             ctx.moveTo(p1.x, p1.y); //Visualizer.getNodeX(inputs, i, left, right), bottom);
             ctx.lineTo(p2.x, p2.y); //Visualizer.getNodeX(outputs, j, left, right), top);
             ctx.lineWidth = 4;
             ctx.strokeStyle = "black";
             ctx.stroke();
          }
       }
       for (let i = 0; i < inputs.length; i++) {
          for (let j = 0; j < outputs.length; j++) {
             ctx.beginPath();
             const p1 = new Point(
                Visualizer.getNodeX(inputs, i, left, right),
                bottom
             );
             const p2 = new Point(
                Visualizer.getNodeX(outputs, j, left, right),
                top
             );
             const seg = new Segment(p1, p2);
             seg.indices = [i, j];
             seg.levelIndex = levelIndex;
             seg.value = weights[i][j];
             Visualizer.segments.push(seg);
             ctx.moveTo(p1.x, p1.y); //Visualizer.getNodeX(inputs, i, left, right), bottom);
             ctx.lineTo(p2.x, p2.y); //Visualizer.getNodeX(outputs, j, left, right), top);
             ctx.lineWidth = 4;
             ctx.strokeStyle = getRGBA(weights[i][j]); //getRGBA(weights[i][j] * inputs[i]);//getRGBA(weights[i][j]);
             ctx.stroke();
          }
       }
 
       for (let i = 0; i < inputs.length; i++) {
          const x = Visualizer.getNodeX(inputs, i, left, right);
          const point = new Point(x, bottom);
          point.index = i;
          point.value = inputs[i];
          point.levelIndex = levelIndex;
          point.inputNode = true;
          Visualizer.inputPoints.push(point);
          ctx.beginPath();
          ctx.arc(x, bottom, nodeRadius, 0, Math.PI * 2);
          ctx.fillStyle = "black";
          ctx.fill();
          ctx.beginPath();
          ctx.arc(x, bottom, nodeRadius * 0.6, 0, Math.PI * 2);
          ctx.fillStyle = getRGBA(inputs[i]);
          ctx.fill();
 
          ctx.setLineDash([]);
 
          if (inputLabels[i]) {
             ctx.beginPath();
             ctx.textAlign = "center";
             ctx.textBaseline = "middle";
             ctx.fillStyle = "white"; //outputColors[i]; //"black";
             ctx.strokeStyle = "white";
             ctx.font =
                nodeRadius * (inputLabels[i] == "🛑" ? 0.9 : 1.1) + "px Arial";
             ctx.fillText(
                inputLabels[i],
                x - (inputLabels[i] == "🛑" ? 0.02 : 0),
                bottom + nodeRadius * (inputLabels[i] == "🛑" ? 0.06 : 0)
             );
             ctx.lineWidth = 0.5;
             ctx.strokeText(
                inputLabels[i],
                x - (inputLabels[i] == "🛑" ? 0.02 : 0),
                bottom + nodeRadius * (inputLabels[i] == "🛑" ? 0.06 : 0)
             );
          }
       }
       if (levelIndex == 0 && Visualizer.selectedInputs.length == 0) {
          Visualizer.selectedInputs = [
             Visualizer.inputPoints.find(
                (p) => p.levelIndex == 0 && p.index == 0
             ),
             Visualizer.inputPoints.find(
                (p) => p.levelIndex == 0 && p.index == 1
             ),
          ];
       }
 
       for (let i = 0; i < outputs.length; i++) {
          const x = Visualizer.getNodeX(outputs, i, left, right);
          const point = new Point(x, top);
          point.levelIndex = levelIndex;
          point.index = i;
          point.value = outputs[i];
          Visualizer.points.push(point);
          ctx.beginPath();
          ctx.arc(x, top, nodeRadius, 0, Math.PI * 2);
          ctx.fillStyle = "black";
          ctx.fill();
          ctx.beginPath();
          ctx.arc(x, top, nodeRadius * 0.6, 0, Math.PI * 2);
          ctx.fillStyle = getRGBA(outputs[i]);
          ctx.fill();
 
          ctx.beginPath();
          ctx.lineWidth = 4;
          ctx.arc(x, top, nodeRadius * 0.8, 0, Math.PI * 2);
          ctx.strokeStyle = getRGBA(biases[i]);
          ctx.setLineDash([3, 3]);
          ctx.stroke();
          ctx.setLineDash([]);
 
          if (outputLabels[i]) {
             ctx.beginPath();
             ctx.textAlign = "center";
             ctx.textBaseline = "middle";
             ctx.fillStyle = outputColors[i]; //"black";
             ctx.strokeStyle = "white";
             ctx.font = nodeRadius * 1.5 + "px Arial";
             ctx.fillText(outputLabels[i], x, top + nodeRadius * 0.1);
             ctx.lineWidth = 0.5;
             ctx.strokeText(outputLabels[i], x, top + nodeRadius * 0.1);
          }
       }
    }
 
    static getNodeX(nodes, index, left, right) {
       return lerp(
          left,
          right,
          nodes.length == 1 ? 0.5 : index / (nodes.length - 1)
       );
    }
 
    static selectAll() {
       Visualizer.selectedWeights = Visualizer.segments;
       Visualizer.selectedBiases = Visualizer.points;
       localStorage.setItem(
          "selectedWeightsAndBiases",
          JSON.stringify({
             weights: Visualizer.selectedWeights,
             biases: Visualizer.selectedBiases,
             inputs: Visualizer.selectedInputs,
          })
       );
    }
    static deselectAll() {
       Visualizer.selectedWeights = [];
       Visualizer.selectedBiases = [];
       localStorage.setItem(
          "selectedWeightsAndBiases",
          JSON.stringify({
             weights: Visualizer.selectedWeights,
             biases: Visualizer.selectedBiases,
             inputs: Visualizer.selectedInputs,
          })
       );
    }
 }
 
 if (localStorage.getItem("selectedWeightsAndBiases")) {
    const info = JSON.parse(localStorage.getItem("selectedWeightsAndBiases"));
    Visualizer.selectedWeights = info.weights.map((i) => {
       const s = new Segment(i.p1, i.p2);
       s.levelIndex = i.levelIndex;
       s.indices = i.indices;
       return s;
    });
    Visualizer.selectedBiases = info.biases.map((i) => {
       const p = new Point(i.x, i.y);
       p.levelIndex = i.levelIndex;
       p.index = i.index;
       return p;
    });
    Visualizer.selectedInputs = info.inputs.map((i) => {
       const p = new Point(i.x, i.y);
       p.inputNode = true;
       p.index = i.index;
       return p;
    });
 }
 