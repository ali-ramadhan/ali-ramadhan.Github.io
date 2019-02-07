var w = 1400;
var h = 700;
var svg = d3.select("div#container").append("svg").attr("preserveAspectRatio", "xMinYMin meet").style("background-color","#c9e8fd")
            .attr("viewBox", "0 0 " + w + " " + h)
            .classed("svg-content", true);
var projection = d3.geoAzimuthalEquidistant().translate([w/2, h/2]).scale(500).center([0, 50]).rotate([90, 0, 0]);
var path = d3.geoPath().projection(projection);

var tooltip = d3.select("body").append("div") 
    .attr("class", "tooltip")       
    .style("opacity", 0);

// load data  
var worldmap = d3.json("d3/NNA_lakes.geojson");

Promise.all([worldmap]).then(function(values){    
  // draw map
  svg.selectAll("path")
     .data(values[0].features)
     .enter()
     .append("path")
     .attr("class","continent")
     .attr("d", path)
     .on("mouseover", function(d) {
        tooltip.transition()
        .duration(200)
        .style("opacity", .8);
        tooltip.html(d.properties.woe_name)
        .style("left", (d3.event.pageX) + "px")
        .style("top", (d3.event.pageY - 28) + "px");
     })          
     .on("mouseout", function(d) {
        tooltip.transition()
        .duration(500)
        .style("opacity", 0);
     });
});