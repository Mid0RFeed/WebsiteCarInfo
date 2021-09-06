#!/usr/bin/python
# -*- coding: utf-8 -*-
from flask import Flask, request, jsonify, render_template

from app.firebase import get_route_rows, get_routes

app = Flask(__name__)


@app.route('/')
def hello_world():
    return render_template('/index.html')


@app.route('/get_route_info')
def get_route_info():
    r_id = request.args.get('route_id')
    start = request.args.get('start')
    route = get_route_rows(r_id, start)
    return jsonify([{
        'time': v['Время отправки'],
        'oil': {
            'cost': v['Расход топлива'].split()[0].replace(',', '.'),
            'temp': v['Температура двигателя'].split()[0],
        },
        'geo': {
            'latitude': v['Широта'],
            'longitude': v['Долгота'],
        }
    } for v in route])


@app.route('/get_routes')
def get_routes_ids():
    return jsonify({
        'last_id': int(get_routes())
    })


if __name__ == '__main__':
    app.run(debug=True)
