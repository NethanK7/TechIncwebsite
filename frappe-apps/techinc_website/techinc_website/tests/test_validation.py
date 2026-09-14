import copy
import unittest
from uuid import uuid4

from techinc_website.validation import QUESTIONS, assessment, contact, fingerprint


class TestValidation(unittest.TestCase):
    def answers(self):
        return [{'question_id': q['id'], 'option_id': q['options'][0]['id']} for q in QUESTIONS]

    def test_score_ignores_forged_client_values(self):
        answers = self.answers()
        for answer in answers:
            answer.update(score=0, answer='forged', question='forged')
        canonical, score, band = assessment(answers, '1')
        self.assertEqual(score, 82)
        self.assertEqual(band, 'Ready now')
        self.assertEqual(canonical[0]['answer'], QUESTIONS[0]['options'][0]['label'])

    def test_missing_duplicate_unknown_and_invalid_options(self):
        duplicate = self.answers(); duplicate[-1] = duplicate[0]
        unknown = self.answers(); unknown[0]['question_id'] = 'unknown'
        invalid = self.answers(); invalid[0]['option_id'] = '999'
        for answers in ([], self.answers()[:-1], duplicate, unknown, invalid, 'bad', [None] * 10):
            with self.subTest(answers=answers), self.assertRaises(ValueError):
                assessment(answers, '1')

    def test_version_and_order(self):
        with self.assertRaises(ValueError):
            assessment(self.answers(), '2')
        self.assertEqual(assessment(self.answers(), '1'), assessment(self.answers()[::-1], '1'))

    def test_normalizes_email_and_requires_identity(self):
        data = {'name': ' Test User ', 'email': ' Test@Example.com ', 'submission_id': str(uuid4())}
        result = contact(data)
        self.assertEqual(result['email'], 'test@example.com')
        self.assertEqual(result['name'], 'Test User')
        for patch in ({'name': ''}, {'email': 'bad'}, {'email': ['bad']}, {'submission_id': 'bad'}, {'message': 'x' * 4001}):
            with self.subTest(patch=patch), self.assertRaises(ValueError):
                contact({**data, **patch})

    def test_retry_hash_ignores_transport_but_not_changed_business_data(self):
        data = contact({'name': 'Test', 'email': 'test@example.com', 'submission_id': str(uuid4())})
        changed = copy.deepcopy(data)
        changed.update(session='new session', page='/other', referrer='different')
        self.assertEqual(fingerprint(data), fingerprint(changed))
        changed['organization'] = 'Different company'
        self.assertNotEqual(fingerprint(data), fingerprint(changed))
