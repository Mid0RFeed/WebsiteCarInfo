import os
import sys

BASE_DIR = '/home/c/cy48072/public_html'
sys.path.append(BASE_DIR)
os.chdir(BASE_DIR)

activate_this = '/home/c/cy48072/myenv/bin/activate_this.py'
exec(open(activate_this).read())

sys.path.append('/home/c/cy48072/myenv/lib/python3.6/site-packages/')

from app import app as application


if __name__ == '__main__':
    application.run()