#!/usr/bin/env python3
"""
Backend API Testing for Mumble AI Authentication and Sessions
Tests all authentication and session management endpoints
"""

import requests
import json
import uuid
from datetime import datetime

# Configuration
BASE_URL = "https://mumble-learn.preview.emergentagent.com/api"
TEST_USER_EMAIL = f"testuser_{uuid.uuid4().hex[:8]}@example.com"
TEST_USER_PASSWORD = "securepassword123"
TEST_USER_NAME = "Test User"

class BackendTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.access_token = None
        self.user_id = None
        self.session_id = None
        self.test_results = []
        
    def log_result(self, test_name, success, details="", response_data=None):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "response_data": response_data,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {details}")
        if response_data and not success:
            print(f"   Response: {response_data}")
    
    def test_user_registration(self):
        """Test POST /api/auth/register"""
        print("\n=== Testing User Registration ===")
        
        # Test successful registration
        payload = {
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD,
            "name": TEST_USER_NAME
        }
        
        try:
            response = requests.post(f"{self.base_url}/auth/register", json=payload)
            
            if response.status_code == 200:
                data = response.json()
                if "access_token" in data and "user" in data:
                    self.access_token = data["access_token"]
                    self.user_id = data["user"]["id"]
                    self.log_result("User Registration - Success", True, 
                                  f"User registered with ID: {self.user_id}")
                else:
                    self.log_result("User Registration - Success", False, 
                                  "Missing access_token or user in response", data)
            else:
                self.log_result("User Registration - Success", False, 
                              f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_result("User Registration - Success", False, f"Exception: {str(e)}")
        
        # Test duplicate email registration
        try:
            response = requests.post(f"{self.base_url}/auth/register", json=payload)
            
            if response.status_code == 400:
                self.log_result("User Registration - Duplicate Email", True, 
                              "Correctly rejected duplicate email")
            else:
                self.log_result("User Registration - Duplicate Email", False, 
                              f"Expected 400, got {response.status_code}", response.text)
        except Exception as e:
            self.log_result("User Registration - Duplicate Email", False, f"Exception: {str(e)}")
        
        # Test invalid email format
        invalid_payload = {
            "email": "invalid-email",
            "password": TEST_USER_PASSWORD,
            "name": TEST_USER_NAME
        }
        
        try:
            response = requests.post(f"{self.base_url}/auth/register", json=invalid_payload)
            
            if response.status_code == 422:  # FastAPI validation error
                self.log_result("User Registration - Invalid Email", True, 
                              "Correctly rejected invalid email format")
            else:
                self.log_result("User Registration - Invalid Email", False, 
                              f"Expected 422, got {response.status_code}", response.text)
        except Exception as e:
            self.log_result("User Registration - Invalid Email", False, f"Exception: {str(e)}")
    
    def test_user_login(self):
        """Test POST /api/auth/login"""
        print("\n=== Testing User Login ===")
        
        # Test successful login
        payload = {
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        }
        
        try:
            response = requests.post(f"{self.base_url}/auth/login", json=payload)
            
            if response.status_code == 200:
                data = response.json()
                if "access_token" in data:
                    # Update token in case it's different
                    self.access_token = data["access_token"]
                    self.log_result("User Login - Valid Credentials", True, 
                                  "Successfully logged in with valid credentials")
                else:
                    self.log_result("User Login - Valid Credentials", False, 
                                  "Missing access_token in response", data)
            else:
                self.log_result("User Login - Valid Credentials", False, 
                              f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_result("User Login - Valid Credentials", False, f"Exception: {str(e)}")
        
        # Test wrong password
        wrong_payload = {
            "email": TEST_USER_EMAIL,
            "password": "wrongpassword"
        }
        
        try:
            response = requests.post(f"{self.base_url}/auth/login", json=wrong_payload)
            
            if response.status_code == 401:
                self.log_result("User Login - Wrong Password", True, 
                              "Correctly rejected wrong password")
            else:
                self.log_result("User Login - Wrong Password", False, 
                              f"Expected 401, got {response.status_code}", response.text)
        except Exception as e:
            self.log_result("User Login - Wrong Password", False, f"Exception: {str(e)}")
        
        # Test non-existent email
        nonexistent_payload = {
            "email": f"nonexistent_{uuid.uuid4().hex[:8]}@example.com",
            "password": TEST_USER_PASSWORD
        }
        
        try:
            response = requests.post(f"{self.base_url}/auth/login", json=nonexistent_payload)
            
            if response.status_code == 401:
                self.log_result("User Login - Non-existent Email", True, 
                              "Correctly rejected non-existent email")
            else:
                self.log_result("User Login - Non-existent Email", False, 
                              f"Expected 401, got {response.status_code}", response.text)
        except Exception as e:
            self.log_result("User Login - Non-existent Email", False, f"Exception: {str(e)}")
    
    def test_get_current_user(self):
        """Test GET /api/auth/me"""
        print("\n=== Testing Get Current User ===")
        
        # Test with valid token
        if self.access_token:
            headers = {"Authorization": f"Bearer {self.access_token}"}
            
            try:
                response = requests.get(f"{self.base_url}/auth/me", headers=headers)
                
                if response.status_code == 200:
                    data = response.json()
                    required_fields = ["id", "email", "name"]
                    if all(field in data for field in required_fields):
                        self.log_result("Get Current User - Valid Token", True, 
                                      f"Retrieved user info: {data['email']}")
                    else:
                        self.log_result("Get Current User - Valid Token", False, 
                                      f"Missing required fields in response", data)
                else:
                    self.log_result("Get Current User - Valid Token", False, 
                                  f"Status: {response.status_code}", response.text)
            except Exception as e:
                self.log_result("Get Current User - Valid Token", False, f"Exception: {str(e)}")
        else:
            self.log_result("Get Current User - Valid Token", False, "No access token available")
        
        # Test without token
        try:
            response = requests.get(f"{self.base_url}/auth/me")
            
            if response.status_code in [401, 403]:
                self.log_result("Get Current User - No Token", True, 
                              "Correctly rejected request without token")
            else:
                self.log_result("Get Current User - No Token", False, 
                              f"Expected 401/403, got {response.status_code}", response.text)
        except Exception as e:
            self.log_result("Get Current User - No Token", False, f"Exception: {str(e)}")
        
        # Test with invalid token
        invalid_headers = {"Authorization": "Bearer invalid_token_12345"}
        
        try:
            response = requests.get(f"{self.base_url}/auth/me", headers=invalid_headers)
            
            if response.status_code == 401:
                self.log_result("Get Current User - Invalid Token", True, 
                              "Correctly rejected invalid token")
            else:
                self.log_result("Get Current User - Invalid Token", False, 
                              f"Expected 401, got {response.status_code}", response.text)
        except Exception as e:
            self.log_result("Get Current User - Invalid Token", False, f"Exception: {str(e)}")
    
    def test_sessions_crud(self):
        """Test Sessions CRUD operations"""
        print("\n=== Testing Sessions CRUD ===")
        
        if not self.access_token:
            self.log_result("Sessions CRUD", False, "No access token available for testing")
            return
        
        headers = {"Authorization": f"Bearer {self.access_token}"}
        
        # Test CREATE session
        session_payload = {
            "title": "Spanish Basics",
            "language": "spanish",
            "level": "beginner",
            "duration_minutes": 30
        }
        
        try:
            response = requests.post(f"{self.base_url}/sessions", json=session_payload, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if "id" in data:
                    self.session_id = data["id"]
                    self.log_result("Sessions - CREATE", True, 
                                  f"Created session with ID: {self.session_id}")
                else:
                    self.log_result("Sessions - CREATE", False, 
                                  "Missing session ID in response", data)
            else:
                self.log_result("Sessions - CREATE", False, 
                              f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_result("Sessions - CREATE", False, f"Exception: {str(e)}")
        
        # Test GET all sessions
        try:
            response = requests.get(f"{self.base_url}/sessions", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_result("Sessions - GET ALL", True, 
                                  f"Retrieved {len(data)} sessions")
                else:
                    self.log_result("Sessions - GET ALL", False, 
                                  "Response is not a list", data)
            else:
                self.log_result("Sessions - GET ALL", False, 
                              f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_result("Sessions - GET ALL", False, f"Exception: {str(e)}")
        
        # Test GET single session
        if self.session_id:
            try:
                response = requests.get(f"{self.base_url}/sessions/{self.session_id}", headers=headers)
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("id") == self.session_id:
                        self.log_result("Sessions - GET SINGLE", True, 
                                      f"Retrieved session: {data.get('title')}")
                    else:
                        self.log_result("Sessions - GET SINGLE", False, 
                                      "Session ID mismatch", data)
                else:
                    self.log_result("Sessions - GET SINGLE", False, 
                                  f"Status: {response.status_code}", response.text)
            except Exception as e:
                self.log_result("Sessions - GET SINGLE", False, f"Exception: {str(e)}")
        
        # Test UPDATE session
        if self.session_id:
            update_payload = {
                "title": "Updated Spanish Basics",
                "status": "completed"
            }
            
            try:
                response = requests.put(f"{self.base_url}/sessions/{self.session_id}", 
                                      json=update_payload, headers=headers)
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("title") == "Updated Spanish Basics":
                        self.log_result("Sessions - UPDATE", True, 
                                      "Successfully updated session")
                    else:
                        self.log_result("Sessions - UPDATE", False, 
                                      "Title not updated correctly", data)
                else:
                    self.log_result("Sessions - UPDATE", False, 
                                  f"Status: {response.status_code}", response.text)
            except Exception as e:
                self.log_result("Sessions - UPDATE", False, f"Exception: {str(e)}")
        
        # Test DELETE session
        if self.session_id:
            try:
                response = requests.delete(f"{self.base_url}/sessions/{self.session_id}", headers=headers)
                
                if response.status_code == 200:
                    self.log_result("Sessions - DELETE", True, 
                                  "Successfully deleted session")
                else:
                    self.log_result("Sessions - DELETE", False, 
                                  f"Status: {response.status_code}", response.text)
            except Exception as e:
                self.log_result("Sessions - DELETE", False, f"Exception: {str(e)}")
        
        # Test sessions without authentication
        try:
            response = requests.get(f"{self.base_url}/sessions")
            
            if response.status_code in [401, 403]:
                self.log_result("Sessions - No Auth", True, 
                              "Correctly rejected unauthenticated request")
            else:
                self.log_result("Sessions - No Auth", False, 
                              f"Expected 401/403, got {response.status_code}", response.text)
        except Exception as e:
            self.log_result("Sessions - No Auth", False, f"Exception: {str(e)}")
    
    def run_all_tests(self):
        """Run all backend tests"""
        print(f"🚀 Starting Backend API Tests")
        print(f"Base URL: {self.base_url}")
        print(f"Test User Email: {TEST_USER_EMAIL}")
        
        # Run tests in order
        self.test_user_registration()
        self.test_user_login()
        self.test_get_current_user()
        self.test_sessions_crud()
        
        # Summary
        print("\n" + "="*60)
        print("📊 TEST SUMMARY")
        print("="*60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['details']}")
        
        return passed_tests, failed_tests, self.test_results

if __name__ == "__main__":
    tester = BackendTester()
    passed, failed, results = tester.run_all_tests()
    
    # Exit with error code if any tests failed
    exit(0 if failed == 0 else 1)