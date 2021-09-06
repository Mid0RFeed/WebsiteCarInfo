jQuery(function ($) {
    $(document).on('ready', function () {
        const oil_cost_data = {
            datasets: [{
                label: 'Расход топлива',
                backgroundColor: '#FF0000',
                // borderColor: Utils.CHART_COLORS.green,
                fill: false,
                data: [],
            }]
        };

        const oil_temp_data = {
            datasets: [{
                label: 'Температура двигателя',
                backgroundColor: '#FF0000',
                // borderColor: Utils.CHART_COLORS.green,
                fill: false,
                data: [],
            }]
        };


        const oil_cost_config = {
            type: 'line',
            data: oil_cost_data,
            options: {

                scales: {
                    xAxes: [{
                        type: 'time',
                        time: {
                            // Luxon format string
                            // tooltipFormat: 'DD T'
                            //   unit: 'day'
                        },
                        title: {
                            display: true,
                            text: 'Date'
                        }
                    }],

                },
            },
        };

        const oil_temp_config = {
            type: 'line',
            data: oil_temp_data,
            options: {

                scales: {
                    xAxes: [{
                        type: 'time',
                        time: {
                            // Luxon format string
                            // tooltipFormat: 'DD T'
                            //   unit: 'day'
                        },
                        title: {
                            display: true,
                            text: 'Date'
                        }
                    }],

                },
            },
        };

        let oil_cost_chart = new Chart(jQuery('#oilCostStatistic')[0].getContext('2d'), oil_cost_config);
        let oil_temp_chart = new Chart(jQuery('#oilTempStatistic')[0].getContext('2d'), oil_temp_config);

        let current_id;
        let routes = {};

        ymaps.ready(init);
        function init() {
            var myMap = new ymaps.Map("map", {
                center: [55.76, 37.64],
                zoom: 7
            });

            function get_route(id, func) {
                let data = {
                    route_id: id,
                    start: undefined
                };
                if (id in routes) {
                    data.start = routes[id].date;
                } else {
                    routes[id] = {
                        center: undefined,
                        polyline: new ymaps.Polyline([], {hintContent: "Маршрут №" + id}, {
                            visible: false,
                            strokeColor: "#1f642d",
                            strokeWidth: 5,
                        }),
                        oil_data: {
                            cost: undefined,
                            temp: undefined
                        },
                        date: undefined,
                        marks: new ymaps.GeoObjectCollection(null, {
                            visible: false,
                        })
                    };

                    myMap.geoObjects.add(routes[id].polyline).add(routes[id].marks);

                }
                $.get('/get_route_info', data, function (data) {
                    func(id, data);
                })
            }

            function update_map() {
                if (current_id === undefined) return;
                get_route(current_id,
                    function (route_id, data) {
                        let route = routes[route_id];
                        if (route.center === undefined) {

                            route.oil_data.cost = fetch_oil_cost(data);
                            route.oil_data.temp = fetch_oil_temp(data);

                            route.polyline.geometry.setCoordinates(fetch_route_points(data));
                            set_oil_cost_data(route.oil_data.cost);
                            set_oil_temp_data(route.oil_data.temp);
                            add_marks_to_route(route, data);

                            route.date = data[data.length - 1].time;
                            route.center = [data[0].geo.latitude, data[0].geo.longitude];
                            myMap.setCenter(route.center, 15);
                        } else {
                            for (let i = 0; i < data.length; i++) {
                                route.polyline.geometry.insert(route.polyline.geometry.getLength(),
                                    [data[i].geo.latitude, data[i].geo.longitude]);
                            }

                            let new_oil_cost = fetch_oil_cost(data);
                            let new_oil_temp = fetch_oil_temp(data);

                            route.oil_data.cost.concat(new_oil_cost);
                            route.oil_data.temp.concat(new_oil_temp);

                            add_oil_cost(new_oil_cost);
                            add_oil_temp(new_oil_temp);
                            add_marks_to_route(route, data);
                        }
                        console.log(data);
                    });
            }

            function update_route_list() {
                $.get('/get_routes', {}, function (data) {
                    for (let i = 1; i <= data.last_id; i++) {
                        $('#routeID').append('<option value="' + i + '">' + i + '</option>');
                    }
                })
            }

            $('#routeID').on('change', function () {
                change_route_visible(current_id);
                init_charts(current_id);
                current_id = $(this).val();
                start_map_update();
                change_route_visible(current_id);
            });

            function add_marks_to_route(route, data){
                data.forEach(el => {
                                route.marks.add(new ymaps.Placemark(
                                    get_latLon(el),
                                    {
                                        iconContent: route.marks.getLength() + 1,
                                        balloonContent: 'Расход топлива: ' + el.oil.cost + '</br>' +
                                            'Температура двигателя: ' + el.oil.temp,
                                    }
                                ))
                            });
            }

            function get_latLon(data) {
                return [data.geo.latitude, data.geo.longitude]
            }

            function fetch_route_points(data) {
                return data.map(get_latLon);
            }

            function fetch_oil_temp(data) {
                return data.map(function (v) {
                    return {
                        x: new Date(v.time),
                        y: v.oil.temp
                    };
                });
            }

            function fetch_oil_cost(data) {
                return data.map(function (v) {
                    return {
                        x: new Date(v.time),
                        y: v.oil.cost
                    };
                });
            }

            let map_updater;

            function start_map_update() {
                if (map_updater) clearInterval(map_updater);
                update_map();
                map_updater = setInterval(update_map, 15000);
            }

            function change_route_visible(route_id) {
                if (route_id === undefined) return;
                routes[route_id].polyline.options.set('visible', routes[route_id].polyline.options.get('visible') ^ 1);
                routes[route_id].marks.options.set('visible', routes[route_id].marks.options.get('visible') ^ 1);
            }

            function init_charts(route_id) {
                clear_charts();
                if (!(route_id in routes)) return;
                set_oil_cost_data(routes[route_id].oil_data.cost);
                set_oil_temp_data(routes[route_id].oil_data.temp);
            }

            function clear_charts() {
                set_oil_temp_data([]);
                set_oil_cost_data([]);
            }

            function set_oil_temp_data(data) {
                oil_temp_chart.data.datasets[0].data = data;
                oil_temp_chart.update();
            }

            function set_oil_cost_data(data) {
                oil_cost_chart.data.datasets[0].data = data;
                oil_cost_chart.update()
            }

            function add_oil_temp(data) {
                if (Array.isArray(data)) {
                    oil_temp_chart.data.datasets[0].data.concat(data);
                } else {
                    oil_temp_chart.data.datasets[0].data.push(data);
                }
                oil_temp_chart.update();
            }

            function add_oil_cost(data) {
                if (Array.isArray(data)) {
                    oil_cost_chart.data.datasets[0].data.concat(data);
                } else {
                    oil_cost_chart.data.datasets[0].data.push(data);
                }
                oil_cost_chart.update();
            }

            function update_charts() {
                oil_cost_chart.update();
                oil_temp_chart.update();
            }

            update_route_list();
        }
    });

});

