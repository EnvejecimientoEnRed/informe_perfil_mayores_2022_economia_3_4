//Desarrollo de las visualizaciones
import * as d3 from 'd3';
//import { numberWithCommas2 } from './helpers';
//import { getInTooltip, getOutTooltip, positionTooltip } from './modules/tooltip';
import { setChartHeight } from '../modules/height';
import { setChartCanvas, setChartCanvasImage } from '../modules/canvas-image';
import { setRRSSLinks } from '../modules/rrss';
import { setFixedIframeUrl } from './chart_helpers';

//Colores fijos
const COLOR_PRIMARY_1 = '#F8B05C', 
COLOR_PRIMARY_2 = '#E37A42', 
COLOR_ANAG_1 = '#D1834F', 
COLOR_ANAG_2 = '#BF2727', 
COLOR_COMP_1 = '#528FAD', 
COLOR_COMP_2 = '#AADCE0', 
COLOR_GREY_1 = '#B5ABA4', 
COLOR_GREY_2 = '#64605A', 
COLOR_OTHER_1 = '#B58753', 
COLOR_OTHER_2 = '#731854';

export function initChart(iframe) {
    //Lectura de datos
    d3.csv('https://raw.githubusercontent.com/CarlosMunozDiazCSIC/informe_perfil_mayores_2022_economia_3_4/main/data/ocde_life_expectancy_v3.csv', function(error,data) {
        if (error) throw error;

        // sort data
        data.sort(function(b, a) {
            return +a.women_years_after - +b.women_years_after;
        });

        //Desarrollo del gráfico
        let currentType = 'viz';

        let margin = {top: 10, right: 10, bottom: 20, left: 110},
            width = document.getElementById('viz').clientWidth - margin.left - margin.right,
            height = document.getElementById('viz').clientHeight - margin.top - margin.bottom;

        let svg = d3.select("#viz")
            .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
            .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        let paises = d3.map(data, function(d){return(d.Country)}).keys();
        let tipos = ['men_years_after', 'women_years_after'];
        
        let y = d3.scaleBand()
            .domain(paises)
            .range([0, height])
            .padding([0.2]);

        let yAxis = function(g) {
            g.call(d3.axisLeft(y));
            g.call(function(svg) {
                svg.selectAll("text")
                .style("font-weight", function(d) { if(d == 'Spain') { return '700'} else { return '400'; }});
            });
        }

        svg.append("g")            
            .call(yAxis);            

        let x = d3.scaleLinear()
            .domain([0, 30])
            .range([ 0 ,width ]);
        
        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x));

        let ySubgroup = d3.scaleBand()
            .domain(tipos)
            .range([0, y.bandwidth()])
            .padding([0]);

        let color = d3.scaleOrdinal()
            .domain(tipos)
            .range([COLOR_PRIMARY_1, COLOR_COMP_1]);

        function initViz() {
            svg.append("g")
                .selectAll("g")
                .data(data)
                .enter()
                .append("g")
                .attr("transform", function(d) { return "translate(0," + y(d.Country) + ")"; })
                .selectAll("rect")
                .data(function(d) { return tipos.map(function(key) { return {key: key, value: d[key]}; }); })
                .enter()
                .append("rect")
                .attr('class', 'prueba')
                .attr("fill", function(d) { return color(d.key); })
                .attr("x", x(0) )
                .attr("y", function(d) { return ySubgroup(d.key); })
                .attr("height", ySubgroup.bandwidth())
                .attr("width", function(d) { return x(0); })            
                .transition()
                .duration(2000)               
                .attr("width", function(d) { return x(d.value); });
        }
    
        function animateChart() {
            svg.selectAll(".prueba")
                .attr("fill", function(d) { return color(d.key); })
                .attr("x", x(0) )
                .attr("y", function(d) { return ySubgroup(d.key); })
                .attr("height", ySubgroup.bandwidth())
                .attr("width", function(d) { return x(0); })            
                .transition()
                .duration(2000)               
                .attr("width", function(d) { return x(d.value); });
        }

        ///// CAMBIO
        function setChart(type) {
            if(type != currentType) {
                if(type == 'viz') {
                    //Cambiamos color botón
                    document.getElementById('data_map').classList.remove('active');
                    document.getElementById('data_viz').classList.add('active');
                    //Cambiamos gráfico
                    document.getElementById('map').classList.remove('active');
                    document.getElementById('viz').classList.add('active');
                } else {
                    //Cambiamos color botón
                    document.getElementById('data_map').classList.add('active');
                    document.getElementById('data_viz').classList.remove('active');
                    //Cambiamos gráfico
                    document.getElementById('viz').classList.remove('active');
                    document.getElementById('map').classList.add('active');
                }
            }            
        }

        /////
        /////
        // Resto - Chart
        /////
        /////
        initViz();

        document.getElementById('data_viz').addEventListener('click', function() {            
            //Cambiamos gráfico
            setChart('viz');
            //Cambiamos valor actual
            currentType = 'viz';
        });

        document.getElementById('data_map').addEventListener('click', function() {
            //Cambiamos gráfico
            setChart('map');
            //Cambiamos valor actual
            currentType = 'map';
        });

        //Animación del gráfico
        document.getElementById('replay').addEventListener('click', function() {
            animateChart();
        });

        //////
        ///// Resto
        //////

        //Iframe
        setFixedIframeUrl('informe_perfil_mayores_2022_economia_3_4','edv_tras_jubilacion');

        //Redes sociales > Antes tenemos que indicar cuál sería el texto a enviar
        setRRSSLinks('edv_tras_jubilacion');

        //Captura de pantalla de la visualización
        setChartCanvas();

        let pngDownload = document.getElementById('pngImage');

        pngDownload.addEventListener('click', function(){
            setChartCanvasImage('edv_tras_jubilacion');
        });

        //Altura del frame
        setChartHeight(iframe);    
    });    
}