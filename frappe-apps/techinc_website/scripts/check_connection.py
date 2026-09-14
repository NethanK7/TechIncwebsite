#!/usr/bin/env python3
"""Read-only health check; credentials come from environment, never CLI output."""
import json
import os
import sys
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


def main():
    names = ('FRAPPE_URL', 'FRAPPE_API_KEY', 'FRAPPE_API_SECRET', 'WEBSITE_INTAKE_SECRET')
    missing = [name for name in names if not os.environ.get(name)]
    if missing:
        sys.exit('Missing environment variables: ' + ', '.join(missing))
    base, key, secret, intake = (os.environ[name] for name in names)
    if not base.startswith('https://'):
        sys.exit('FRAPPE_URL must use HTTPS.')
    request = Request(base.rstrip('/') + '/api/method/techinc_website.api.public.health',
                      data=json.dumps({'website_secret': intake}).encode(), method='POST',
                      headers={'Content-Type': 'application/json', 'Authorization': f'token {key}:{secret}'})
    try:
        with urlopen(request, timeout=15) as response:
            body = json.load(response).get('message', {})
        if not body.get('ok'):
            sys.exit('Unexpected response. Verify app installation and URL.')
        print(f'Connected: Techinc Website {body["version"]}; leads: {body["lead_doctype"]}; '
              f'assignment: {"enabled" if body["assignment_enabled"] else "disabled"}')
    except HTTPError as exc:
        sys.exit(f'Connection rejected (HTTP {exc.code}). Check Frappe settings and credentials.')
    except (URLError, TimeoutError, ValueError, KeyError):
        sys.exit('Unable to verify connection. Check HTTPS reachability and Frappe logs.')


if __name__ == '__main__':
    main()
