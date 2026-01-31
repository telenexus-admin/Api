import requests
import sys
import json
from datetime import datetime

class TelenexusAPITester:
    def __init__(self, base_url="https://api-integration-73.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        result = {
            "test": name,
            "success": success,
            "details": details or {},
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}")
        if details and not success:
            print(f"    Details: {details}")

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'

        print(f"\n🔍 Testing {name}...")
        print(f"    URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=30)

            success = response.status_code == expected_status
            details = {
                "expected_status": expected_status,
                "actual_status": response.status_code,
                "response": response.text[:500] if not success else "Success"
            }
            
            if success:
                try:
                    response_data = response.json()
                    details["response_data"] = response_data
                except:
                    response_data = {}
            else:
                response_data = {}
            
            self.log_test(name, success, details)
            return success, response_data

        except Exception as e:
            details = {"error": str(e)}
            self.log_test(name, False, details)
            return False, {}

    def test_health_check(self):
        """Test health endpoint and Evolution API connection"""
        success, response = self.run_test(
            "Health Check - Evolution API Connection",
            "GET",
            "health",
            200
        )
        
        if success:
            evolution_status = response.get("evolution_api", "unknown")
            if evolution_status == "connected":
                self.log_test("Evolution API Connection Status", True, {"status": evolution_status})
                return True
            else:
                self.log_test("Evolution API Connection Status", False, {"status": evolution_status})
                return False
        return False

    def test_register(self, email, password, name, company=None):
        """Test user registration"""
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data={
                "email": email,
                "password": password,
                "name": name,
                "company": company
            }
        )
        
        if success and 'access_token' in response and 'user' in response:
            self.token = response['access_token']
            self.user_id = response['user']['id']
            return True
        return False

    def test_login(self, email, password):
        """Test user login"""
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data={
                "email": email,
                "password": password
            }
        )
        
        if success and 'access_token' in response and 'user' in response:
            self.token = response['access_token']
            self.user_id = response['user']['id']
            return True
        return False

    def test_create_instance(self, name, description=None):
        """Test instance creation"""
        success, response = self.run_test(
            "Create WhatsApp Instance",
            "POST",
            "instances",
            200,
            data={
                "name": name,
                "description": description
            }
        )
        
        if success and 'id' in response and 'evolution_instance_name' in response:
            return response['id'], response
        return None, {}

    def test_get_instances(self):
        """Test getting instances list"""
        success, response = self.run_test(
            "Get Instances List",
            "GET",
            "instances",
            200
        )
        
        if success and isinstance(response, list):
            return response
        return []

    def test_get_single_instance(self, instance_id):
        """Test getting single instance with QR code"""
        success, response = self.run_test(
            "Get Single Instance with QR Code",
            "GET",
            f"instances/{instance_id}",
            200
        )
        
        return success, response

    def test_delete_instance(self, instance_id):
        """Test instance deletion"""
        success, response = self.run_test(
            "Delete WhatsApp Instance",
            "DELETE",
            f"instances/{instance_id}",
            200
        )
        
        return success

    def print_summary(self):
        """Print test summary"""
        print(f"\n{'='*50}")
        print(f"📊 Test Summary")
        print(f"{'='*50}")
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.tests_passed != self.tests_run:
            print(f"\n❌ Failed Tests:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['test']}: {result['details'].get('error', result['details'])}")

def main():
    print("🚀 Starting Telenexus API Integration Tests")
    print("=" * 60)
    
    tester = TelenexusAPITester()
    
    # Test unique email for this run
    timestamp = datetime.now().strftime('%H%M%S')
    test_email = f"test_{timestamp}@telenexus.com"
    test_password = "TestPass123!"
    test_name = f"Test User {timestamp}"
    test_company = "Telenexus Test Co"
    
    # Step 1: Test health check and Evolution API connection
    print("\n📋 Step 1: Health Check & Evolution API Connection")
    health_ok = tester.test_health_check()
    if not health_ok:
        print("⚠️ Health check failed - continuing with other tests")
    
    # Step 2: Test user registration
    print(f"\n📋 Step 2: User Registration")
    if not tester.test_register(test_email, test_password, test_name, test_company):
        print("❌ Registration failed - stopping tests")
        tester.print_summary()
        return 1
    
    # Step 3: Test user login (with new user)
    print(f"\n📋 Step 3: User Login")
    # Reset token to test fresh login
    tester.token = None
    if not tester.test_login(test_email, test_password):
        print("❌ Login failed - stopping tests")
        tester.print_summary()
        return 1
    
    # Step 4: Test instance creation
    print(f"\n📋 Step 4: WhatsApp Instance Creation")
    instance_id, instance_data = tester.test_create_instance(
        f"Test Instance {timestamp}",
        "Test WhatsApp instance for API testing"
    )
    
    if not instance_id:
        print("❌ Instance creation failed - stopping tests")
        tester.print_summary()
        return 1
    
    print(f"✅ Created instance: {instance_id}")
    
    # Step 5: Test getting instances list
    print(f"\n📋 Step 5: Get Instances List")
    instances = tester.test_get_instances()
    if instances:
        print(f"✅ Found {len(instances)} instance(s)")
        for inst in instances:
            print(f"   - {inst.get('name')} ({inst.get('status', 'unknown')})")
    
    # Step 6: Test getting single instance with QR code
    print(f"\n📋 Step 6: Get Instance Details with QR Code")
    success, instance_detail = tester.test_get_single_instance(instance_id)
    if success:
        status = instance_detail.get('status', 'unknown')
        has_qr = bool(instance_detail.get('qr_code'))
        evolution_name = instance_detail.get('evolution_instance_name', 'N/A')
        print(f"✅ Instance status: {status}")
        print(f"   QR Code present: {has_qr}")
        print(f"   Evolution instance name: {evolution_name}")
    
    # Step 7: Test instance deletion
    print(f"\n📋 Step 7: Delete WhatsApp Instance")
    if tester.test_delete_instance(instance_id):
        print(f"✅ Instance {instance_id} deleted successfully")
    
    # Print final summary
    tester.print_summary()
    
    # Return exit code based on test results
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())