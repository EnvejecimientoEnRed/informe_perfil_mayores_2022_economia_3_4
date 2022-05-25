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
    d3.csv('https://raw.githubusercontent.com/EnvejecimientoEnRed/informe_perfil_mayores_2022_economia_3_4/clevelandPlot/data/ocde_life_expectancy_v2_spanish.csv', function(error,data) {
        if (error) throw error;

        data.sort(function(b, a) { return +b.men_exit - +a.men_exit; });

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
            g.call(d3.axisBottom(x).tickValues([50,60,65,70,80,90]));
            svg.call(function(g) {
                g.call(function(g){
                    g.selectAll('.tick line')
                        .attr('class', function(d,i) {
                            if (d == 65) {
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
                .attr('class', function(d) {
                    return 'line line_' + d.Country;
                })
                .attr("x1", function(d) { return 0; })
                .attr("x2", function(d) { return 0 })
                .attr("y1", function(d) { return y(d.Country) + y.bandwidth() / 2; })
                .attr("y2", function(d) { return y(d.Country) + y.bandwidth() / 2; })
                .attr("stroke", COLOR_PRIMARY_1)
                .attr('opacity', function(d) {
                    if(d.Country == 'España' || d.Country == 'UE-27' || d.Country == 'OCDE') { return '1'} else { return '0.55'; }
                })
                .attr("stroke-width", "6px")
                .on('mouseover', function(d,i,e) {
                    //Opacidad en barras
                    let bars = svg.selectAll('.line');                    
            
                    bars.each(function() {
                        this.style.opacity = '0.15';
                    });
                    this.style.opacity = '1';

                    //Tooltip
                    let html = '';
                    let sex = currentSex == 'male' ? 'los hombres' : 'las mujeres';
                    let sexSearch = currentSex == 'male' ? ['men_exit', 'men_years_after'] : ['women_exit', 'women_years_after'];
                    let suma = parseFloat(d[sexSearch[0]]) + parseFloat(d[sexSearch[1]]);
                    suma = suma.toFixed(2);

                    if(d.Country == 'UE-27') {
                        html = '<p class="chart__tooltip--title">' + d.Country + '</p>' + 
                            '<p class="chart__tooltip--text">La edad real de jubilación para <b>' + sex  + '</b> es <b>' + numberWithCommas3(parseFloat(d[sexSearch[0]])) + '</b> años y se espera que vivan <b>' + numberWithCommas3(parseFloat(d[sexSearch[1]])) + '</b> años más (hasta los <b>' + numberWithCommas3(suma) + '</b>) en la Unión Europea</p>';
                    } else if (d.Country == 'OCDE') {
                        html = '<p class="chart__tooltip--title">' + d.Country + '</p>' + 
                            '<p class="chart__tooltip--text">La edad real de jubilación para <b>' + sex  + '</b> es <b>' + numberWithCommas3(parseFloat(d[sexSearch[0]])) + '</b> años y se espera que vivan <b>' + numberWithCommas3(parseFloat(d[sexSearch[1]])) + '</b> años más (hasta los <b>' + numberWithCommas3(suma) + '</b>) en la OCDE</p>';
                    } else {
                        html = '<p class="chart__tooltip--title">' + d.Country + '</p>' + 
                            '<p class="chart__tooltip--text">La edad real de jubilación para <b>' + sex  + '</b> es <b>' + numberWithCommas3(parseFloat(d[sexSearch[0]])) + '</b> años y se espera que vivan <b>' + numberWithCommas3(parseFloat(d[sexSearch[1]])) + '</b> años más (hasta los <b>' + numberWithCommas3(suma) + '</b>) en este país</p>';
                    }                    
                    
                    tooltip.html(html);

                    //Tooltip
                    positionTooltip(window.event, tooltip);
                    getInTooltip(tooltip);
                })
                .on('mouseout', function(d,i,e) {
                    //Quitamos los estilos de la línea
                    let bars = svg.selectAll('.line');

                    bars.each(function() {
                        if(this.classList[1] == 'line_España' || this.classList[1] == 'line_UE-27' || this.classList[1] == 'line_OCDE') {
                            this.style.opacity = '1';
                        } else {
                            this.style.opacity = '0.55';
                        }                        
                    });
                
                    //Quitamos el tooltip
                    getOutTooltip(tooltip);
                })
                .transition()
                .duration(2500)
                .attr("x1", function(d) { return x(d.men_exit); })
                .attr("x2", function(d) { let suma = parseFloat(d.men_exit) + parseFloat(d.men_years_after); return x(suma); })
        }
    
        function animateChart() {
            setViz(currentSex);
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
            data.sort(function(b, a) { 
                if(sex == 'male') {
                    return +b.men_exit - +a.men_exit;
                } else {
                    return +b.women_exit - +a.women_exit;
                } });

            //Ordenación eje
            paises = d3.map(data, function(d){return(d.Country)}).keys();
            y.domain(paises);
            svg.select('.yaxis').call(yAxis);
            
            //Gráfico
            svg.append("g")
                .attr('class', 'chart-g')
                .selectAll('mylines')
                .data(data)
                .enter()
                .append("line")
                .attr('class', function(d) {
                    return 'line line_' + d.Country;
                })
                .attr("x1", function(d) { return 0; })
                .attr("x2", function(d) { return 0; })
                .attr("y1", function(d) { return y(d.Country) + y.bandwidth() / 2; })
                .attr("y2", function(d) { return y(d.Country) + y.bandwidth() / 2; })
                .attr("stroke", function(d) {
                    if (sex == 'male') {
                        return COLOR_PRIMARY_1;
                    } else {
                        return COLOR_COMP_1;
                    }
                })
                .attr('opacity', function(d) {
                    if(d.Country == 'España' || d.Country == 'UE-27' || d.Country == 'OCDE') { return '1'} else { return '0.55'; }
                })
                .attr("stroke-width", "6px")
                .on('mouseover', function(d,i,e) {
                    //Opacidad en barras
                    let bars = svg.selectAll('.line');                    
            
                    bars.each(function() {
                        this.style.opacity = '0.15';
                    });
                    this.style.opacity = '1';

                    //Tooltip
                    let html = '';
                    let sex = currentSex == 'male' ? 'los hombres' : 'las mujeres';
                    let sexSearch = currentSex == 'male' ? ['men_exit', 'men_years_after'] : ['women_exit', 'women_years_after'];
                    let suma = parseFloat(d[sexSearch[0]]) + parseFloat(d[sexSearch[1]]);
                    suma = suma.toFixed(2);

                    if(d.Country == 'UE-27') {
                        html = '<p class="chart__tooltip--title">' + d.Country + '</p>' + 
                            '<p class="chart__tooltip--text">La edad real de jubilación para <b>' + sex  + '</b> es <b>' + numberWithCommas3(parseFloat(d[sexSearch[0]])) + '</b> años y se espera que vivan <b>' + numberWithCommas3(parseFloat(d[sexSearch[1]])) + '</b> años más (hasta los <b>' +  numberWithCommas3(suma) + '</b>) en la Unión Europea</p>';
                    } else if (d.Country == 'OCDE') {
                        html = '<p class="chart__tooltip--title">' + d.Country + '</p>' + 
                            '<p class="chart__tooltip--text">La edad real de jubilación para <b>' + sex  + '</b> es <b>' + numberWithCommas3(parseFloat(d[sexSearch[0]])) + '</b> años y se espera que vivan <b>' + numberWithCommas3(parseFloat(d[sexSearch[1]])) + '</b> años más (hasta los <b>' + numberWithCommas3(suma) + '</b>) en la OCDE</p>';
                    } else {
                        html = '<p class="chart__tooltip--title">' + d.Country + '</p>' + 
                            '<p class="chart__tooltip--text">La edad real de jubilación para <b>' + sex  + '</b> es <b>' + numberWithCommas3(parseFloat(d[sexSearch[0]])) + '</b> años y se espera que vivan <b>' + numberWithCommas3(parseFloat(d[sexSearch[1]])) + '</b> años más (hasta los <b>' + numberWithCommas3(suma) + '</b>) en este país</p>';
                    }                    
                    
                    tooltip.html(html);

                    //Tooltip
                    positionTooltip(window.event, tooltip);
                    getInTooltip(tooltip);
                })
                .on('mouseout', function(d,i,e) {
                    //Quitamos los estilos de la línea
                    let bars = svg.selectAll('.line');

                    bars.each(function() {
                        if(this.classList[1] == 'line_España' || this.classList[1] == 'line_UE-27' || this.classList[1] == 'line_OCDE') {
                            this.style.opacity = '1';
                        } else {
                            this.style.opacity = '0.55';
                        }                        
                    });
                
                    //Quitamos el tooltip
                    getOutTooltip(tooltip);
                })
                .transition()
                .duration(2500)
                .attr("x1", function(d) { if(sex == 'male') { return x(d.men_exit); } else { return x(d.women_exit); }  })
                .attr("x2", function(d) { if(sex == 'male') { let suma = parseFloat(d.men_exit) + parseFloat(d.men_years_after); return x(suma); } else { let suma = parseFloat(d.women_exit) + parseFloat(d.women_years_after); return x(suma); }  });
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