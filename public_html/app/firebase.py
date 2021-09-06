#!/usr/bin/python
# -*- coding: utf-8 -*-
import time
from datetime import datetime

import firebase_admin
from firebase_admin import credentials
from firebase_admin import db

cred = credentials.Certificate('./app/carcheck-49e91-firebase-adminsdk-r2i4h-4448303741.json')
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://carcheck-49e91-default-rtdb.europe-west1.firebasedatabase.app/'
})

ref = db.reference('/OBDII')


def convert_date(s):
    return datetime.strptime(s, '%Y-%m-%d, %H:%M:%S')


def get_route_rows(r_id, start=None):
    rows = ref.order_by_child('Номер поездки').equal_to(str(r_id)).get()
    if not start:
        return list(rows.values())
    start = convert_date(start)
    return list(filter(lambda x: start < convert_date(x['Время отправки']), rows.values()))


def get_routes():
    rows = ref.order_by_key().limit_to_last(1).get()
    if rows:
        return next(iter(rows.items()))[1]['Номер поездки']
    return 0
