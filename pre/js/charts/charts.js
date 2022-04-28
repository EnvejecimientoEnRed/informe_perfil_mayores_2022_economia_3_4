//Desarrollo de las visualizaciones
import * as d3 from 'd3';
import { numberWithCommas3 } from '../helpers';
import { getInTooltip, getOutTooltip, positionTooltip } from '../modules/tooltip';
import { setChartHeight } from '../modules/height';
import { setChartCanvas, setChartCanvasImage } from '../modules/canvas-image';
import { setRRSSLinks } from '../modules/rrss';
import { setFixedIframeUrl } from './chart_helpers';

//Colores fijos
const COLOR_PRIMARY_1 = '#F8B05C',
COLOR_COMP_1 = '#528FAD';
let tooltip = d3.select('#tooltip');

export function initChart() {
    //Lectura de datos
    d3.csv('https://raw.githubusercontent.com/CarlosMunozDiazCSIC/informe_perfil_mayores_2022_economia_3_4/main/data/ocde_life_expectancy_v2_spanish.csv', function(error,data) {
        if (error) throw error;

        // sort data
        data.sort(function(b, a) { return +a.women_years_after - +b.women_years_after; });

        //Desarrollo del gráfico
        let currentType = 'viz';

        let margin = {top: 12.5, right: 10, bottom: 25, left: 110},
            width = document.getElementById('chart').clientWidth - margin.left - margin.right,
            height = document.getElementById('chart').clientHeight - margin.top - margin.bottom;

        let svg = d3.select("#chart")
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
            .padding(0.15)
            .paddingInner(0.25);

        let yAxis = function(g) {
            g.call(d3.axisLeft(y));
            g.call(function(svg) {
                svg.selectAll("text")
                .style("font-weight", function(d) { if(d == 'España' || d == 'UE-27' || d == 'OCDE') { return '700'} else { return '400'; }});
            });
            g.call(function(g){g.selectAll('.tick line').remove()});
            g.call(function(g){g.select('.domain').remove()});
        }

        svg.append("g")
            .attr('class','yaxis')
            .call(yAxis);           

        let x = d3.scaleLinear()
            .domain([0, 30])
            .range([ 0 ,width ]);
        
        let xAxis = function(g) {
            g.call(d3.axisBottom(x).ticks(3));
            svg.call(function(g) {
                g.call(function(g){
                    g.selectAll('.tick line')
                        .attr('class', function(d,i) {
                            if (d == 0) {
                                return 'line-special';
                            }
                        })
                        .attr('y1', '0%')
                        .attr('y2', `-${height}`)
                });
            });
        }

        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        let ySubgroup = d3.scaleBand()
            .domain(tipos)
            .range([0, y.bandwidth()])
            .padding(0);

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
                .attr('class', function(d) {
                    return 'grupo grupo_' + d.Country;
                })
                .selectAll("rect")
                .data(function(d) { return tipos.map(function(key) { return {key: key, value: d[key]}; }); })
                .enter()
                .append("rect")
                .attr('class', function(d) {
                    return 'rect rect_' + d.key;
                })
                .attr("fill", function(d) { return color(d.key); })
                .attr("x", x(0) )
                .attr("y", function(d) { return ySubgroup(d.key); })
                .attr("height", ySubgroup.bandwidth())
                .attr("width", function(d) { return x(0); })
                .on('mouseover', function(d,i,e) {
                    console.log(d);
                    //Opacidad en barras
                    let css = e[i].getAttribute('class').split(' ')[1];
                    let bars = svg.selectAll('.rect');                    
            
                    bars.each(function() {
                        this.style.opacity = '0.4';
                        let split = this.getAttribute('class').split(" ")[1];
                        if(split == `${css}`) {
                            this.style.opacity = '1';
                        }
                    });

                    //Tooltip > Recuperamos el año de referencia
                    let currentCountry = this.parentNode.classList.value;
                    let sex = d.key == 'women_years_after' ? 'mujeres' : 'hombres';

                    let html = '';
                    if(d.Country == 'UE-27') {
                        html = '<p class="chart__tooltip--title">' + currentCountry.split('_')[1] + '</p>' + 
                            '<p class="chart__tooltip--text">Los años de vida esperados tras la jubiliación para <b>' + sex  + '</b> son <b>' + numberWithCommas3(parseFloat(d.value)) + '</b> en la Unión Europea</p>';
                    } else if (d.Country == 'OCDE') {
                        html = '<p class="chart__tooltip--title">' + currentCountry.split('_')[1] + '</p>' + 
                            '<p class="chart__tooltip--text">Los años de vida esperados tras la jubiliación para <b>' + sex  + '</b> son <b>' + numberWithCommas3(parseFloat(d.value)) + '</b> en la OCDE</p>';
                    } else {
                        html = '<p class="chart__tooltip--title">' + currentCountry.split('_')[1] + '</p>' + 
                            '<p class="chart__tooltip--text">Los años de vida esperados tras la jubiliación para <b>' + sex  + '</b> son <b>' + numberWithCommas3(parseFloat(d.value)) + '</b> en este país</p>';
                    }                    
                    
                    tooltip.html(html);

                    //Tooltip
                    positionTooltip(window.event, tooltip);
                    getInTooltip(tooltip);

                })
                .on('mouseout', function(d,i,e) {
                    //Quitamos los estilos de la línea
                    let bars = svg.selectAll('.rect');
                    bars.each(function() {
                        this.style.opacity = '1';
                    });
                
                    //Quitamos el tooltip
                    getOutTooltip(tooltip); 
                })         
                .transition()
                .duration(2000)               
                .attr("width", function(d) { return x(d.value); });
        }
    
        function animateChart() {
            svg.selectAll(".rect")
                .attr("fill", function(d) { return color(d.key); })
                .attr("x", x(0) )
                .attr("y", function(d) { return ySubgroup(d.key); })
                .attr("height", ySubgroup.bandwidth())
                .attr("width", function(d) { return x(0); })            
                .transition()
                .duration(2000)               
                .attr("width", function(d) { return x(d.value); });
        }

        ///// CAMBIO GRÁFICO-MAPA
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

        document.getElementById('order-male').addEventListener('click', function(e) {
            setViz('men_years_after');

            setTimeout(() => {
                setChartCanvas();
            }, 4000);
        });

        document.getElementById('order-female').addEventListener('click', function(e) {
            setViz('women_years_after');

            setTimeout(() => {
                setChartCanvas();
            }, 4000);
        });

        function setViz(tipo) {
            // sort data
            data.sort(function(b, a) { return +a[tipo] - +b[tipo]; });

            //Reordenación de eje Y y de columnas
            paises = d3.map(data, function(d){return(d.Country)}).keys();
            y.domain(paises);
            svg.select('.yaxis').call(yAxis);

            svg.selectAll('.grupo')
                .data(data)
                .attr("transform", function(d) { return "translate(0," + y(d.Country) + ")"; })
                .attr('class', function(d) {
                    return 'grupo grupo_' + d.Country;
                })
                .selectAll(".rect")
                .data(function(d) { return tipos.map(function(key) { return {key: key, value: d[key]}; }); })
                .attr("x", x(0) )
                .attr("y", function(d) { return ySubgroup(d.key); })
                .attr("height", ySubgroup.bandwidth())
                .attr("width", function(d) { return x(d.value); });
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

            setTimeout(() => {
                setChartCanvas();
            }, 4000);
        });

        document.getElementById('data_map').addEventListener('click', function() {
            //Cambiamos gráfico
            setChart('map');
            //Cambiamos valor actual
            currentType = 'map';

            setTimeout(() => {
                setChartCanvas();
            }, 4000);
        });

        //Animación del gráfico
        document.getElementById('replay').addEventListener('click', function() {
            animateChart();

            setTimeout(() => {
                setChartCanvas();
            }, 4000);
        });

        //////
        ///// Resto
        //////

        //Iframe
        setFixedIframeUrl('informe_perfil_mayores_2022_economia_3_4','edv_tras_jubilacion');

        //Redes sociales > Antes tenemos que indicar cuál sería el texto a enviar
        setRRSSLinks('edv_tras_jubilacion');

        //Captura de pantalla de la visualización
        setTimeout(() => {
            setChartCanvas();
        }, 4000);

        let pngDownload = document.getElementById('pngImage');

        pngDownload.addEventListener('click', function(){
            setChartCanvasImage('edv_tras_jubilacion');
        });

        //Altura del frame
        setChartHeight();    
    });    
}