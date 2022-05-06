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

        //Desarrollo del gráfico
        let currentType = 'viz', currentSex = 'male';

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
            .domain([50, 92])
            .range([ 0 ,width ]);
        
        let xAxis = function(g) {
            g.call(d3.axisBottom(x).ticks(5));
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

        function initViz() {
            //Hombres
            svg.append("g")
                .attr('class', 'chart-g')
                .selectAll('mylines')
                .data(data)
                .enter()
                .append("line")
                .attr("x1", function(d) { return x(d.men_exit); })
                .attr("x2", function(d) { let suma = parseFloat(d.men_exit) + parseFloat(d.men_years_after); return x(suma); })
                .attr("y1", function(d) { return y(d.Country) + y.bandwidth() / 2; })
                .attr("y2", function(d) { return y(d.Country) + y.bandwidth() / 2; })
                .attr("stroke", COLOR_PRIMARY_1)
                .attr("stroke-width", "6px");
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

        ///// CAMBIO HOMBRES-MUJERES
        function setViz(sex) {
            //Cambiamos estilo de botones
            if(sex == 'male') {
                //Cambiamos color botón
                document.getElementById('data_female').classList.remove('active');
                document.getElementById('data_male').classList.add('active');
            } else {
                //Cambiamos color botón
                document.getElementById('data_female').classList.add('active');
                document.getElementById('data_male').classList.remove('active');
            }            

            ///Removemos lo actual
            svg.select('.chart-g')
                .remove();

            ///Nuevos datos con 'sex'
            svg.append("g")
                .attr('class', 'chart-g')
                .selectAll('mylines')
                .data(data)
                .enter()
                .append("line")
                .attr("x1", function(d) { if(sex == 'male') { return x(d.men_exit); } else { return x(d.women_exit); }  })
                .attr("x2", function(d) { if(sex == 'male') { let suma = parseFloat(d.men_exit) + parseFloat(d.men_years_after); return x(suma); } else { let suma = parseFloat(d.women_exit) + parseFloat(d.women_years_after); return x(suma); }  })
                .attr("y1", function(d) { return y(d.Country) + y.bandwidth() / 2; })
                .attr("y2", function(d) { return y(d.Country) + y.bandwidth() / 2; })
                .attr("stroke", function(d) {
                    if (sex == 'male') {
                        return COLOR_PRIMARY_1;
                    } else {
                        return COLOR_COMP_1;
                    }
                } )
                .attr("stroke-width", "6px");
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
        
        /////
        /////
        // Resto
        /////
        /////
        initViz();

        /////// Gráfico - Hombres o mujeres
        document.getElementById('data_male').addEventListener('click', function() {
            //Cambiamos valor actual
            currentSex = 'male';

            //Cambiamos gráfico
            setViz(currentSex);
            

            setTimeout(() => {
                setChartCanvas();
            }, 4000);
        });

        document.getElementById('data_female').addEventListener('click', function() {
            //Cambiamos valor actual
            currentSex = 'female';

            //Cambiamos gráfico
            setViz(currentSex);            

            setTimeout(() => {
                setChartCanvas();
            }, 4000);
        });

        /////// Gráfico - Gráfico o mapa
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