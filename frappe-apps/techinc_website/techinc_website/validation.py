"""Pure validation, shared by the API and tests. No browser-supplied scores."""
import hashlib
import json
import math
import re
from pathlib import Path
from uuid import UUID

QUESTIONS = json.loads(Path(__file__).with_name('assessment_v1.json').read_text())
VERSION = '1'


def text(value, label, maximum=140, required=False):
    if value is None:
        value = ''
    if not isinstance(value, str):
        raise ValueError(f'{label} must be text.')
    value = value.strip()
    if (required and not value) or len(value) > maximum or '\x00' in value:
        raise ValueError(f'Check {label} (maximum {maximum} characters).')
    return value


def contact(data):
    result = {key: text(data.get(key), key, size, key in ('name', 'email')) for key, size in {
        'name': 120, 'email': 140, 'phone': 40, 'organization': 140,
        'industry': 80, 'employees': 40, 'interest': 120,
        'message': 4000, 'page': 140, 'referrer': 500, 'session': 80,
    }.items()}
    if len(result['name']) < 2:
        raise ValueError('Please give us your name.')
    result['email'] = result['email'].lower()
    if not re.fullmatch(r'[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+', result['email']):
        raise ValueError('Please give us a valid email address.')
    try:
        result['submission_id'] = str(UUID(text(data.get('submission_id'), 'submission ID', 36, True)))
    except (ValueError, AttributeError):
        raise ValueError('A valid submission ID is required.') from None
    return result


def assessment(answers, version):
    if version != VERSION:
        raise ValueError('This assessment has changed. Refresh the page and start again.')
    if not isinstance(answers, list) or len(answers) != len(QUESTIONS):
        raise ValueError('Please answer all assessment questions.')
    choices = {}
    for answer in answers:
        if not isinstance(answer, dict):
            raise ValueError('Invalid assessment answer.')
        qid = text(answer.get('question_id'), 'question ID', 30, True)
        oid = text(answer.get('option_id'), 'option ID', 10, True)
        if qid in choices:
            raise ValueError('Duplicate assessment question.')
        choices[qid] = oid
    canonical = []
    for question in QUESTIONS:
        option = next((o for o in question['options'] if o['id'] == choices.get(question['id'])), None)
        if option is None:
            raise ValueError('Invalid assessment option or missing question.')
        canonical.append(dict(question_id=question['id'], option_id=option['id'],
                              question=question['question'], answer=option['label'], score=option['score']))
    score = math.floor(sum(a['score'] for a in canonical) / len(QUESTIONS) * 10 + 0.5)
    band = next(label for threshold, label in [(80, 'Ready now'), (62, 'Nearly ready'),
                                               (42, 'Groundwork first'), (0, 'Not yet')] if score >= threshold)
    return canonical, score, band


def fingerprint(data):
    # Transport context changes on retries; business data must remain the same.
    stable = {k: v for k, v in data.items() if k not in ('session', 'page', 'referrer', 'submission_id')}
    return hashlib.sha256(json.dumps(stable, sort_keys=True, ensure_ascii=False).encode()).hexdigest()
