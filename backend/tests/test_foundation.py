from django.test import TestCase, Client
from django.conf import settings
from django.db import connection

class BackendFoundationTests(TestCase):
    def setUp(self):
        self.client = Client()

    def test_database_connection(self):
        """Verifies database connection is active and healthy."""
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            row = cursor.fetchone()
            self.assertEqual(row[0], 1)

    def test_root_redirects_to_swagger(self):
        """Verifies root path redirects to OpenAPI Swagger UI."""
        response = self.client.get('/')
        self.assertEqual(response.status_code, 302)
        self.assertEqual(response.url, '/api/docs/')

    def test_swagger_docs_accessible(self):
        """Verifies Swagger UI endpoint returns 200 OK."""
        response = self.client.get('/api/docs/')
        self.assertEqual(response.status_code, 200)

    def test_openapi_schema_endpoint(self):
        """Verifies OpenAPI schema endpoint returns 200 OK."""
        response = self.client.get('/api/schema/')
        self.assertEqual(response.status_code, 200)

    def test_cors_settings_configured(self):
        """Verifies CORS origins are parsed and set."""
        self.assertTrue(len(settings.CORS_ALLOWED_ORIGINS) > 0)
        self.assertTrue(settings.CORS_ALLOW_CREDENTIALS)

    def test_installed_apps_present(self):
        """Verifies all local apps and third-party packages are installed."""
        expected_apps = [
            'daphne',
            'rest_framework',
            'channels',
            'apps.accounts',
            'apps.facilities',
            'apps.triage',
            'apps.consultations',
            'apps.analytics',
        ]
        for app in expected_apps:
            self.assertIn(app, settings.INSTALLED_APPS)
