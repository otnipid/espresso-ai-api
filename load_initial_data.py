#!/usr/bin/env python3
"""
Script to load initial data from Excel spreadsheet into the Espresso AI database via API.
"""

import pandas as pd
import requests
import json
from datetime import datetime, time
from typing import Dict, Optional, List
import sys

# Configuration
API_BASE_URL = "https://espresso-ai-api.onrender.com/api"
EXCEL_FILE_PATH = "/Users/nicholasdipinto/CascadeProjects/espresso-ml/espresso-data.xlsx"

class DataLoader:
    def __init__(self, api_base_url: str):
        self.api_base_url = api_base_url
        self.session = requests.Session()
        self.bean_uuids = {}
        self.bean_batch_ids = {}
        self.machine_id = None
        self.grinder_id = None
        self.user_id = None
        self.shot_ids = {}
        
    def load_excel_data(self) -> pd.DataFrame:
        """Load data from Excel file."""
        try:
            df = pd.read_excel(EXCEL_FILE_PATH)
            print(f"Loaded {len(df)} rows from Excel file")
            print(f"Columns: {df.columns.tolist()}")
            return df
        except Exception as e:
            print(f"Error loading Excel file: {e}")
            sys.exit(1)
    
    def create_unique_beans(self, df: pd.DataFrame):
        """Create unique bean entries from Roaster Name and Batch Name columns, avoiding duplicates."""
        print("Creating beans...")
        
        # First, get existing beans
        existing_beans = {}
        try:
            response = self.session.get(f"{self.api_base_url}/beans")
            if response.status_code == 200:
                beans = response.json()
                for bean in beans:
                    key = f"{bean['roaster']}_{bean['name']}"
                    existing_beans[key] = bean['id']
                print(f"Found {len(existing_beans)} existing beans")
        except Exception as e:
            print(f"Error getting existing beans: {e}")
        
        # Get unique combinations of Roaster Name and Batch Name
        unique_beans = df[['Roaster Name', 'Batch Name', 'Country']].drop_duplicates()
        
        for _, row in unique_beans.iterrows():
            bean_key = f"{row['Roaster Name']}_{row['Batch Name']}"
            
            # Skip if bean already exists
            if bean_key in existing_beans:
                self.bean_uuids[bean_key] = existing_beans[bean_key]
                print(f"Using existing bean: {row['Batch Name']} with ID: {existing_beans[bean_key]}")
                continue
            
            bean_data = {
                "name": row['Batch Name'],
                "roaster": row['Roaster Name'],
                # "country": row['Country'] if pd.notna(row['Country']) and str(row['Country']).strip() != '' else None,
            }
            
            try:
                print(f"Sending bean data: {bean_data}")
                response = self.session.post(
                    f"{self.api_base_url}/beans",
                    json=bean_data
                )
                
                if response.status_code == 201:
                    bean_result = response.json()
                    self.bean_uuids[bean_key] = bean_result['id']
                    print(f"Created bean: {row['Batch Name']} with ID: {bean_result['id']}")
                else:
                    print(f"Error creating bean {row['Batch Name']}: {response.status_code} - {response.text}")
                    
            except Exception as e:
                print(f"Exception creating bean {row['Batch Name']}: {e}")
    
    def create_bean_batches(self, df: pd.DataFrame):
        """Create bean batches from unique Roast and Roast Date combinations, avoiding duplicates."""
        print("Creating bean batches...")
        
        # First, get existing batches
        existing_batches = {}
        try:
            response = self.session.get(f"{self.api_base_url}/batches")
            if response.status_code == 200:
                batches = response.json()
                for batch in batches:
                    # Create a key that matches our format
                    bean_key = f"{batch['bean']['roaster']}_{batch['bean']['name']}"
                    batch_key = f"{bean_key}_{batch['roastLevel']}_{batch['roastDate'][:10]}"  # Just date part
                    existing_batches[batch_key] = batch['id']
                print(f"Found {len(existing_batches)} existing batches")
        except Exception as e:
            print(f"Error getting existing batches: {e}")
        
        # Get unique combinations for bean batches
        unique_batches = df[['Roaster Name', 'Batch Name', 'Roast', 'Roast Date']].drop_duplicates()
        
        for _, row in unique_batches.iterrows():
            bean_key = f"{row['Roaster Name']}_{row['Batch Name']}"
            bean_id = self.bean_uuids.get(bean_key)
            
            if not bean_id:
                print(f"Warning: No bean ID found for {bean_key}")
                continue
            
            # Create batch key for checking duplicates
            roast_date_str = str(row['Roast Date'])[:10] if pd.notna(row['Roast Date']) else ''
            batch_key = f"{bean_key}_{row['Roast']}_{roast_date_str}"
            
            # Skip if batch already exists
            if batch_key in existing_batches:
                self.bean_batch_ids[batch_key] = existing_batches[batch_key]
                print(f"Using existing batch with ID: {existing_batches[batch_key]}")
                continue
            
            batch_data = {
                "beanId": bean_id,
                "roastDate": row['Roast Date'].to_pydatetime().isoformat() + 'Z' if pd.notna(row['Roast Date']) else None,
                "roastLevel": row['Roast'] if pd.notna(row['Roast']) else None
            }
            
            try:
                print(f"Sending batch data: {batch_data}")
                response = self.session.post(
                    f"{self.api_base_url}/batches",
                    json=batch_data
                )
                
                if response.status_code == 201:
                    batch_result = response.json()
                    self.bean_batch_ids[batch_key] = batch_result['id']
                    print(f"Created batch with ID: {batch_result['id']}")
                else:
                    print(f"Error creating batch: {response.status_code} - {response.text}")
                    
            except Exception as e:
                print(f"Exception creating batch: {e}")
    
    def create_machine(self):
        """Get or create the machine entry."""
        print("Getting machine...")
        
        # First try to get existing machines
        try:
            response = self.session.get(f"{self.api_base_url}/machines")
            
            if response.status_code == 200:
                machines = response.json()
                if machines and len(machines) > 0:
                    self.machine_id = machines[0]['id']
                    print(f"Using existing machine with ID: {self.machine_id}")
                    return
        except Exception as e:
            print(f"Error getting machines: {e}")
        
        # If no machines exist, try to create one
        machine_data = {
            "model": "Barista Express",
            "firmware_version": None
        }
        
        try:
            response = self.session.post(
                f"{self.api_base_url}/machines",
                json=machine_data
            )
            
            if response.status_code == 201:
                machine_result = response.json()
                self.machine_id = machine_result['id']
                print(f"Created machine with ID: {machine_result['id']}")
            else:
                print(f"Error creating machine: {response.status_code} - {response.text}")
                # Use a placeholder ID for now
                self.machine_id = "00000000-0000-0000-0000-000000000000"
                print(f"Using placeholder machine ID: {self.machine_id}")
                
        except Exception as e:
            print(f"Exception creating machine: {e}")
            self.machine_id = "00000000-0000-0000-0000-000000000000"
            print(f"Using placeholder machine ID: {self.machine_id}")
    
    def create_user(self):
        """Create or get existing user entry."""
        print("Creating user...")
        
        # First, check if user already exists
        try:
            response = self.session.get(f"{self.api_base_url}/users")
            if response.status_code == 200:
                users = response.json()
                # Look for user with matching email
                for user in users:
                    if user.get('email') == 'ndipinto@protonmail.com':
                        self.user_id = user['id']
                        print(f"Using existing user with ID: {user['id']}")
                        return
        except Exception as e:
            print(f"Error checking existing users: {e}")
        
        # Create new user if not found
        user_data = {
            "name": "Nick",
            "email": "ndipinto@protonmail.com"
        }
        
        try:
            response = self.session.post(
                f"{self.api_base_url}/users",
                json=user_data
            )
            
            if response.status_code == 201:
                user_result = response.json()
                self.user_id = user_result['id']
                print(f"Created user with ID: {user_result['id']}")
            else:
                print(f"Error creating user: {response.status_code} - {response.text}")
                # Use a placeholder ID for now
                self.user_id = "00000000-0000-0000-0000-000000000002"
                print(f"Using placeholder user ID: {self.user_id}")
                
        except Exception as e:
            print(f"Exception creating user: {e}")
            self.user_id = "00000000-0000-0000-0000-000000000002"
            print(f"Using placeholder user ID: {self.user_id}")

    def create_grinder(self):
        """Create or get existing grinder entry."""
        print("Creating grinder...")
        
        # First, check if grinder already exists
        try:
            response = self.session.get(f"{self.api_base_url}/grinders")
            if response.status_code == 200:
                grinders = response.json()
                # Look for grinder with matching model and manufacturer
                for grinder in grinders:
                    if (grinder.get('model') == 'Barista Express' and 
                        grinder.get('manufacturer') == 'Breville'):
                        self.grinder_id = grinder['id']
                        print(f"Using existing grinder with ID: {grinder['id']}")
                        return
        except Exception as e:
            print(f"Error checking existing grinders: {e}")
        
        # Create new grinder if not found
        grinder_data = {
            "model": "Barista Express",
            "manufacturer": "Breville"
        }
        
        try:
            response = self.session.post(
                f"{self.api_base_url}/grinders",
                json=grinder_data
            )
            
            if response.status_code == 201:
                grinder_result = response.json()
                self.grinder_id = grinder_result['id']
                print(f"Created grinder with ID: {grinder_result['id']}")
            else:
                print(f"Error creating grinder: {response.status_code} - {response.text}")
                # Use a placeholder ID for now
                self.grinder_id = "00000000-0000-0000-0000-000000000001"
                print(f"Using placeholder grinder ID: {self.grinder_id}")
                
        except Exception as e:
            print(f"Exception creating grinder: {e}")
            self.grinder_id = "00000000-0000-0000-0000-000000000001"
            print(f"Using placeholder grinder ID: {self.grinder_id}")
    
    def create_shots(self, df: pd.DataFrame):
        """Create shot entries, avoiding duplicates."""
        print("Creating shots...")
        
        # First, get existing shots
        existing_shots = {}
        try:
            response = self.session.get(f"{self.api_base_url}/shots")
            if response.status_code == 200:
                shots_data = response.json()
                shots = shots_data.get('shots', [])
                for shot in shots:
                    # Use pulled_at and bean batch as a unique identifier
                    pulled_at = shot.get('pulled_at', '')
                    bean_batch_id = shot.get('beanBatchId', '')
                    key = f"{pulled_at}_{bean_batch_id}"
                    existing_shots[key] = shot['id']
                print(f"Found {len(existing_shots)} existing shots")
        except Exception as e:
            print(f"Error getting existing shots: {e}")
        
        for index, row in df.iterrows():
            # Find the corresponding bean batch
            bean_key = f"{row['Roaster Name']}_{row['Batch Name']}"
            batch_key = f"{bean_key}_{row['Roast']}_{str(row['Roast Date'])[:10]}"
            bean_batch_id = self.bean_batch_ids.get(batch_key)
            
            if not bean_batch_id:
                print(f"Warning: No bean batch ID found for {batch_key}")
                continue
            
            # Determine success based on yield
            yield_grams = row['Yield (grams)']
            success = False
            if pd.notna(yield_grams) and 34 <= yield_grams <= 38:
                success = True
            
            # Parse shot date and set time to 8 AM
            shot_date = row['Shot Date']
            if pd.notna(shot_date):
                if isinstance(shot_date, str):
                    shot_datetime = datetime.strptime(shot_date, '%Y-%m-%d')
                else:
                    shot_datetime = shot_date.to_pydatetime()
                shot_datetime = shot_datetime.replace(hour=8, minute=0, second=0, microsecond=0)
                # Convert to ISO format with timezone
                pulled_at = shot_datetime.isoformat() + 'Z'
            else:
                pulled_at = None
            
            # Check if shot already exists
            shot_key = f"{pulled_at}_{bean_batch_id}"
            if shot_key in existing_shots:
                self.shot_ids[index] = existing_shots[shot_key]
                print(f"Using existing shot with ID: {existing_shots[shot_key]}")
                continue
            
            shot_data = {
                "userId": self.user_id,
                "machineId": self.machine_id,
                "beanBatchId": bean_batch_id,
                "grinderId": self.grinder_id,
                "shot_type": "normale",
                "pulled_at": pulled_at,
                "success": success
            }
            
            try:
                response = self.session.post(
                    f"{self.api_base_url}/shots",
                    json=shot_data
                )
                
                if response.status_code == 201:
                    shot_result = response.json()
                    self.shot_ids[index] = shot_result['id']
                    print(f"Created shot with ID: {shot_result['id']}")
                else:
                    print(f"Error creating shot at row {index}: {response.status_code} - {response.text}")
                    
            except Exception as e:
                print(f"Exception creating shot at row {index}: {e}")
    
    def create_shot_preparations(self, df: pd.DataFrame):
        """Create shot preparation entries, avoiding duplicates."""
        print("Creating shot preparations...")
        
        # First, get existing preparations
        existing_preps = {}
        try:
            response = self.session.get(f"{self.api_base_url}/preparations")
            if response.status_code == 200:
                preparations = response.json()
                for prep in preparations:
                    shot_id = prep.get('shot_id', '')
                    key = f"{shot_id}"
                    existing_preps[key] = prep['id']
                print(f"Found {len(existing_preps)} existing preparations")
        except Exception as e:
            print(f"Error getting existing preparations: {e}")
        
        for index, row in df.iterrows():
            shot_id = self.shot_ids.get(index)
            if not shot_id:
                continue
            
            # Check if preparation already exists
            if shot_id in existing_preps:
                print(f"Using existing preparation for shot {shot_id}")
                continue
            prep_data = {
                "shot_id": shot_id,
                "dose_grams": row['Dose (grams)'] if pd.notna(row['Dose (grams)']) else None,
                "burr_setting": row['Burr Setting'] if pd.notna(row['Burr Setting']) else None,
                "side_hopper": row['Side Hopper'] if pd.notna(row['Side Hopper']) else None,
            }
            
            try:
                response = self.session.post(
                    f"{self.api_base_url}/preparations",
                )
                
                if response.status_code == 201:
                    print(f"Created preparation for shot {shot_id}")
                else:
                    print(f"Error creating preparation for shot {shot_id}: {response.status_code} - {response.text}")
                    
            except Exception as e:
                print(f"Exception creating preparation for shot {shot_id}: {e}")
    
    def create_shot_extractions(self, df: pd.DataFrame):
        """Create shot extraction entries, avoiding duplicates."""
        print("Creating shot extractions...")
        
        # First, get existing extractions
        existing_extractions = {}
        try:
            response = self.session.get(f"{self.api_base_url}/extractions")
            if response.status_code == 200:
                extractions = response.json()
                for ext in extractions:
                    shot_id = ext.get('shot_id', '')
                    key = f"{shot_id}"
                    existing_extractions[key] = ext['id']
                print(f"Found {len(existing_extractions)} existing extractions")
        except Exception as e:
            print(f"Error getting existing extractions: {e}")
        
        for index, row in df.iterrows():
            shot_id = self.shot_ids.get(index)
            if not shot_id:
                continue
            
            # Check if extraction already exists
            if shot_id in existing_extractions:
                print(f"Using existing extraction for shot {shot_id}")
                continue
            
            extraction_data = {
                "shot_id": shot_id,
                "water_temp_c": 93,
                "shot_time_seconds": row['Extraction Time (seconds)'] if pd.notna(row['Extraction Time (seconds)']) else None,
                "yield_grams": row['Yield (grams)'] if pd.notna(row['Yield (grams)']) else None,
                "peak_pressure_bar": row['Pressure (bars)'] if pd.notna(row['Pressure (bars)']) else None,
                "avg_pressure_bar": row['Pressure (bars)'] if pd.notna(row['Pressure (bars)']) else None,
                "preinfusion_seconds": row['Pre-Infusion Time (seconds)'] if pd.notna(row['Pre-Infusion Time (seconds)']) else None
            }
            
            try:
                response = self.session.post(
                    f"{self.api_base_url}/extractions",
                    json=extraction_data
                )
                
                if response.status_code == 201:
                    print(f"Created extraction for shot {shot_id}")
                else:
                    print(f"Error creating extraction for shot {shot_id}: {response.status_code} - {response.text}")
                    
            except Exception as e:
                print(f"Exception creating extraction for shot {shot_id}: {e}")
    
    def load_all_data(self):
        """Execute the complete data loading process."""
        print("Starting data loading process...")
        
        # Load Excel data
        df = self.load_excel_data()
        
        # Create base entities
        self.create_user()
        self.create_machine()
        self.create_grinder()
        
        # Create beans and batches
        self.create_unique_beans(df)
        self.create_bean_batches(df)
        
        # Create shots and related data
        self.create_shots(df)
        self.create_shot_preparations(df)
        self.create_shot_extractions(df)
        
        print("Data loading completed!")
        print(f"Summary:")
        print(f"- Beans created: {len(self.bean_uuids)}")
        print(f"- Batches created: {len(self.bean_batch_ids)}")
        print(f"- Shots created: {len(self.shot_ids)}")
        print(f"- Machine ID: {self.machine_id}")
        print(f"- Grinder ID: {self.grinder_id}")
        print(f"- User ID: {self.user_id}")

def main():
    """Main function to run the data loader."""
    loader = DataLoader(API_BASE_URL)
    
    # Test API connection
    try:
        response = requests.get("https://espresso-ai-api.onrender.com/health")
        if response.status_code != 200:
            print(f"API health check failed: {response.status_code}")
            print("Please ensure the backend server is running on https://espresso-ai-api.onrender.com")
            sys.exit(1)
    except requests.exceptions.ConnectionError:
        print("Cannot connect to API server")
        print("Please ensure the backend server is running on https://espresso-ai-api.onrender.com")
        sys.exit(1)
    
    try:
        # Load Excel data
        df = loader.load_excel_data()
        
        # Create beans and batches to get proper IDs
        loader.create_unique_beans(df)
        loader.create_bean_batches(df)
        
        # Create machine
        loader.create_machine()
        
        # Create user and grinder if needed
        loader.create_user()
        loader.create_grinder()
        
        # Load shots and related data
        loader.create_shots(df)
        loader.create_shot_preparations(df)
        loader.create_shot_extractions(df)
        
        print("\nData loading completed!")
        print(f"Summary:")
        print(f"- Beans created: {len(loader.bean_uuids)}")
        print(f"- Batches created: {len(loader.bean_batch_ids)}")
        print(f"- Shots created: {len(loader.shot_ids)}")
        print(f"- Machine ID: {loader.machine_id}")
        print(f"- Grinder ID: {loader.grinder_id}")
        print(f"- User ID: {loader.user_id}")
        
    except Exception as e:
        print(f"Error: {e}")
        print("Please ensure the backend server is running on https://espresso-ai-api.onrender.com")
        sys.exit(1)

if __name__ == "__main__":
    main()
