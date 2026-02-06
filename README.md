# RDS IAM Authentication - NodeJS Application

[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![AWS](https://img.shields.io/badge/AWS-Cloud-FF9900?logo=amazon-aws&logoColor=white)](https://aws.amazon.com/)
[![RDS](https://img.shields.io/badge/AWS_RDS-MySQL-527FFF?logo=amazon-rds&logoColor=white)](https://aws.amazon.com/rds/)
[![EC2](https://img.shields.io/badge/AWS_EC2-Compute-FF9900?logo=amazon-ec2&logoColor=white)](https://aws.amazon.com/ec2/)
[![Docker](https://img.shields.io/badge/Docker-Container-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![IAM](https://img.shields.io/badge/AWS_IAM-Authentication-FF9900?logo=amazon-aws&logoColor=white)](https://aws.amazon.com/iam/)
[![Systems Manager](https://img.shields.io/badge/AWS_Systems_Manager-Configuration-FF9900?logo=amazon-aws&logoColor=white)](https://aws.amazon.com/systems-manager/)

A Node.js application demonstrating secure database connectivity to AWS RDS using IAM authentication instead of traditional database credentials.

> **YouTube Companion Guide**: This project includes a comprehensive step-by-step YouTube tutorial that walks through the entire setup process. Follow along with the video for detailed visual instructions on each step.

## Table of Contents
- [Project Overview](#project-overview)
- [Why IAM Authentication for RDS?](#why-iam-authentication-for-rds)
- [Architecture Overview](#architecture-overview)
- [Prerequisites](#prerequisites)
- [AWS Infrastructure Setup](#aws-infrastructure-setup)
- [Database Setup](#database-setup)
- [Application Configuration](#application-configuration)
- [EC2 Deployment Guide](#ec2-deployment-guide)
- [IAM Instance Profile Policy](#iam-instance-profile-policy)
- [Testing the Application](#testing-the-application)
- [Troubleshooting](#troubleshooting)
- [Documentation References](#documentation-references)

## Project Overview

This project demonstrates how to authenticate to AWS RDS MySQL databases using IAM authentication, eliminating the need to store database passwords in your application code. The application uses AWS temporary credentials to generate authentication tokens dynamically, providing enhanced security and auditing capabilities.

The implementation uses a practical, production-ready architecture with:
- **Private RDS Database** in private subnets with NAT gateway access
- **EC2 Instance** accessing RDS via IAM authentication tokens
- **AWS Systems Manager Session Manager** for secure EC2 access (no SSH keys needed)
- **SSM Parameter Store** for application configuration management
- **Docker** for containerized application deployment

### Key Features:
- ✅ IAM-based authentication to RDS
- ✅ No hardcoded database passwords
- ✅ Temporary token-based access (15-minute expiration)
- ✅ Configuration management via AWS Systems Manager Parameter Store
- ✅ Docker containerization on EC2
- ✅ SSM Session Manager for secure instance access
- ✅ Both password and IAM authentication enabled on RDS

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        AWS Account                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  VPC (Private + Public Subnets)                      │ │
│  │                                                      │ │
│  │  ┌────────────────────────────────────────────────┐ │ │
│  │  │  Public Subnet (NAT Gateway)                   │ │ │
│  │  └────────────────────────────────────────────────┘ │ │
│  │                        ▲                            │ │
│  │                        │ Outbound                   │ │
│  │                        │                            │ │
│  │  ┌────────────────────────────────────────────────┐ │ │
│  │  │  Private Subnets                                │ │ │
│  │  │  ┌──────────────────────────────────────────┐  │ │ │
│  │  │  │  EC2 Instance (Ubuntu 24.04)      │  │ │ │
│  │  │  │  ├─ SSM Instance Profile          │  │ │ │
│  │  │  │  ├─ rds-db:connect IAM Policy    │  │ │ │
│  │  │  │  ├─ Docker (app container)        │  │ │ │
│  │  │  │  └─ mysql-client                  │  │ │ │
│  │  │  └──┬──────────────────────────────┬─┘  │ │ │
│  │  │     │ (Port 3306)                  │    │ │ │
│  │  │  ┌──▼──────────────────────────────▼─┐  │ │ │
│  │  │  │  RDS MySQL Instance               │  │ │ │
│  │  │  │  ├─ Password Auth (Admin)        │  │ │ │
│  │  │  │  ├─ IAM Auth (app_user)          │  │ │ │
│  │  │  │  └─ 3 Private Subnets (HA)       │  │ │ │
│  │  │  └────────────────────────────────┘  │ │ │
│  │  │                                      │ │ │
│  │  │  Security Groups:                    │ │ │
│  │  │  - EC2-SG: No inbound (SSM only)     │ │ │
│  │  │  - RDS-SG: Port 3306 from EC2-SG     │ │ │
│  │  └────────────────────────────────────┘ │ │
│  │                                         │ │
│  └─────────────────────────────────────────┘ │
│                                              │
│  ┌──────────────────────────────────────────┐ │
│  │  AWS Systems Manager                     │ │
│  │  ├─ Session Manager (EC2 access)        │ │
│  │  └─ Parameter Store (App config)        │ │
│  └──────────────────────────────────────────┘ │
│                                               │
└───────────────────────────────────────────────┘
```

## Why IAM Authentication for RDS?

### Security Benefits:

1. **No Password Management**: Eliminates the need to store, rotate, and manage database passwords in your application.

2. **Short-lived Credentials**: Authentication tokens expire after 15 minutes, reducing the risk if credentials are compromised.

3. **Centralized Access Control**: Leverage AWS IAM policies for fine-grained access control across your entire AWS environment.

4. **Audit Trail**: All database connections are logged in CloudTrail, providing complete visibility into who accessed the database and when.

5. **Credential Rotation**: AWS automatically rotates the underlying credentials without application intervention.

6. **Compliance**: Helps meet compliance requirements (SOC 2, PCI-DSS, HIPAA) by eliminating shared passwords and maintaining audit trails.

### Comparison with Traditional Authentication:

| Aspect | IAM Authentication | Traditional Passwords |
|--------|-------------------|----------------------|
| Credential Storage | AWS Temporary Credentials (EC2 metadata) | Stored in environment/config |
| Lifetime | 15 minutes (short-lived token) | No expiration |
| Rotation | AWS managed | Manual process |
| Audit Trail | CloudTrail logs | Limited visibility |
| Scaling | Seamless across instances | Manual credential management |

## Prerequisites

### AWS Account & Permissions
- AWS account with appropriate permissions to create:
  - VPC with subnets and NAT gateway
  - Security groups
  - RDS MySQL instance
  - EC2 instance
  - IAM roles and policies
  - Systems Manager Parameter Store

### Local Development (Optional)
- Node.js 20.x or higher
- npm/yarn package manager
- AWS CLI v2
- MySQL client (for database connection testing)
- Git

### AWS Management Console
This project is primarily managed through the AWS Management Console. All infrastructure setup is done via the console UI, which is demonstrated in the YouTube video companion guide.

## AWS Infrastructure Setup

This section outlines the AWS infrastructure setup performed via the AWS Management Console. Refer to the YouTube video for detailed visual walkthrough of each step.

### Step 1: Create VPC with Public and Private Subnets

1. Navigate to **VPC Dashboard** → **VPCs**
2. Click **Create VPC**
3. Configure:
   - Name: `rds-iam-vpc` (or your preference)
   - IPv4 CIDR block: `10.0.0.0/16`
4. Create the VPC
5. Once created, go to **Subnets** and create:
   - **Public Subnet**: `10.0.1.0/24` (for NAT Gateway) - AZ a
   - **Private Subnet 1**: `10.0.10.0/24` - AZ a (for RDS)
   - **Private Subnet 2**: `10.0.20.0/24` - AZ b (for RDS)
   - **Private Subnet 3**: `10.0.30.0/24` - AZ c (for RDS)

### Step 2: Set Up NAT Gateway for Private Subnet Outbound Access

1. Navigate to **VPC Dashboard** → **NAT Gateways**
2. Click **Create NAT Gateway**
3. Configure:
   - Subnet: Select the public subnet (`10.0.1.0/24`)
   - Allocate Elastic IP
4. Wait for NAT Gateway to be in "Available" state

### Step 3: Create Route Tables

1. Navigate to **VPC Dashboard** → **Route Tables**

**Public Route Table:**
- Create new route table for public subnet
- Add route: `0.0.0.0/0` → Internet Gateway
- Associate with public subnet

**Private Route Table:**
- Create new route table for private subnets
- Add route: `0.0.0.0/0` → NAT Gateway (created in Step 2)
- Associate with all three private subnets

### Step 4: Create Security Groups

Navigate to **VPC Dashboard** → **Security Groups** and create two security groups:

**EC2-SG (EC2 Security Group)**
- Name: `EC2-SG`
- Description: Security group for EC2 instance
- **Inbound Rules**: NONE (SSM Session Manager only)
- **Outbound Rules** (keep default):
  - HTTPS to RDS security group (port 3306)

**RDS-SG (RDS Security Group)**
- Name: `RDS-SG`
- Description: Security group for RDS MySQL instance
- **Inbound Rules**:
  - Type: "MySQL/Aurora"
  - Port: 3306
  - Source: Select `EC2-SG` security group
- **Outbound Rules**: Keep default (all outbound allowed)

## Database Setup

This section covers RDS setup and IAM database user creation via the AWS Management Console.

### Step 1: Create RDS Subnet Group

1. Navigate to **RDS Dashboard** → **Subnet Groups**
2. Click **Create DB Subnet Group**
3. Configure:
   - Name: `rds-subnet-group`
   - VPC: Select the VPC created earlier
   - Availability Zones: Select all 3 AZs (a, b, c)
   - Subnets: Select the 3 private subnets (`10.0.10.0/24`, `10.0.20.0/24`, `10.0.30.0/24`)
4. Create the subnet group

### Step 2: Create RDS MySQL Instance with IAM Authentication

1. Navigate to **RDS Dashboard** → **Databases**
2. Click **Create Database**
3. Configure as follows:

**Database Creation Method**
- Select: "Standard Create"

**Engine Options**
- Engine: "MySQL"
- Version: "MySQL 8.0.x" or latest stable (8.0.35+)

**Templates**
- Select: "Free tier" or "Dev/Test" (depending on your needs)

**DB Instance Identifier**
- Name: `rds-iam-mysql` (or your preference)

**Credentials Settings**
- Master username: `admin`
- Master password: Generate strong password and save securely
- Confirm password: Same as above

**Instance Configuration**
- DB instance class: `db.t4g.micro` (free tier eligible)
- Storage: 20 GB (free tier eligible)

**Connectivity**
- VPC: Select the VPC created earlier
- DB Subnet Group: Select `rds-subnet-group`
- Public accessibility: "No" (remains in private subnets)
- VPC Security Group: Select `RDS-SG`
- Availability Zone: Keep as "No preference"

**Database Authentication**
- **CRITICAL**: Enable **both** options:
  - ✅ Password authentication
  - ✅ **IAM database authentication** (THIS IS KEY!)

**Backup & Monitoring**
- Automated backups: **Disabled** (for educational/cost purposes)
- Enable CloudWatch Logs: Check all log types (optional)

**Additional Configuration**
- Initial database name: `rds_app_db` (or your preference)
- Enable automated minor version upgrade: Yes

4. Click **Create Database**
5. Wait 5-10 minutes for the instance to reach "Available" status

### Step 3: Store RDS Password in AWS Secrets Manager

The RDS master password is securely stored in AWS Secrets Manager:

1. Navigate to **AWS Secrets Manager** → **Secrets**
2. Click **Store a new secret**
3. Configure:
   - Secret type: Select **Credentials for RDS database**
   - Username: `admin`
   - Password: The master password you created for RDS
   - Database: Select your RDS instance
4. Click **Store**
5. Note the secret ARN for future reference

This approach keeps the database password secure and separate from your application code.

### Step 4: Create IAM Database User

Once the RDS instance is available:

1. On your local machine or EC2 instance, connect to RDS as the admin user:
   ```bash
   # If you have mysql-client installed locally or on EC2
   mysql -h <your-rds-endpoint> -u admin -p
   ```
   Replace `<your-rds-endpoint>` with your RDS endpoint (found in RDS Dashboard)

2. When prompted, enter the master password you created

3. Once connected, run the following SQL commands:

   ```sql
   -- Create a database user that uses AWS IAM authentication
   CREATE USER 'app_user'@'%' IDENTIFIED WITH AWSAuthenticationPlugin AS 'RDS';

   -- Grant necessary privileges
   GRANT SELECT, INSERT, UPDATE, DELETE, CREATE ON rds_app_db.* TO 'app_user'@'%';

   -- Verify the user was created
   SELECT User, Host, plugin FROM mysql.user WHERE User = 'app_user';
   ```

4. Exit the MySQL prompt:
   ```bash
   EXIT;
   ```

> **Note**: The `app_user` uses AWS authentication instead of a password. Authentication is done via temporary IAM tokens generated by the EC2 instance.

## Application Configuration

### Configuration via AWS Systems Manager Parameter Store

Instead of using a `.env` file, database configuration is stored in AWS Systems Manager Parameter Store. This approach has several advantages:

- **No hardcoded secrets** in the codebase
- **Centralized configuration** management
- **Easy updates** without redeploying
- **Audit trail** of configuration changes

### Create Parameters in AWS Systems Manager

1. Navigate to **AWS Systems Manager** → **Parameter Store**
2. Click **Create Parameter** and create the following parameters (matching the names in `src/config.js`):

**Parameter 1: Database Endpoint**
- Name: `/demo/rds/endpoint`
- Type: String
- Value: Your RDS endpoint (e.g., `rds-iam-mysql.cyucot0xapry.us-east-1.rds.amazonaws.com`)
- Encrypt: **No** (not encrypted)

**Parameter 2: Database Port**
- Name: `/demo/rds/port`
- Type: String
- Value: `3306`
- Encrypt: **No** (not encrypted)

**Parameter 3: Database Name**
- Name: `/demo/rds/dbname`
- Type: String
- Value: `rds_app_db`
- Encrypt: **No** (not encrypted)

**Parameter 4: Database User**
- Name: `/demo/rds/username`
- Type: String
- Value: `app_user`
- Encrypt: **No** (not encrypted)

**Parameter 5: Database Region**
- Name: `/demo/rds/region`
- Type: String
- Value: Your AWS region (e.g., `us-east-1`)
- Encrypt: **No** (not encrypted)

### Application Startup

The application automatically loads these parameters from SSM Parameter Store when it starts. The application code in `src/config.js` handles parameter retrieval:

```javascript
// Example of how config.js retrieves parameters
const ssm = new AWS.SSM({ region: process.env.AWS_REGION });

const params = {
  Names: [
    '/demo/rds/endpoint',
    '/demo/rds/port',
    '/demo/rds/dbname',
    '/demo/rds/username',
    '/demo/rds/region'
  ],
  WithDecryption: false  // Parameters are stored unencrypted
};

const response = await ssm.getParameters(params).promise();
```

The application uses these values to:
1. Connect to RDS using the endpoint
2. Generate IAM authentication token using temporary EC2 credentials
3. Authenticate as the `app_user` using the token

## EC2 Deployment Guide

This section covers deploying the application on an EC2 instance running Ubuntu 24.04 LTS. The EC2 instance is configured with AWS Systems Manager Session Manager for secure access (no SSH keys required).

### Step 1: Create IAM Role for EC2 Instance

The EC2 instance needs an IAM role with permissions to:
- Access AWS Systems Manager Session Manager
- Retrieve parameters from Systems Manager Parameter Store
- Generate RDS IAM authentication tokens

#### Option A: Using AWS Management Console

1. Navigate to **IAM Dashboard** → **Roles**
2. Click **Create role**
3. Select **AWS service** as the trusted entity
4. Select **EC2** as the service
5. Click **Next**
6. On the "Add permissions" page, attach the following managed policies:
   - `AmazonSSMManagedInstanceCore` (for Session Manager access)
7. Click **Next** → **Create role**
8. Name the role: `RDSIAMAuthRole`
9. Click **Create role**

#### Step 1b: Add Inline Policy for SSM and RDS

1. After creating the role, open it in IAM Dashboard
2. Click **Add inline policy** (on the Permissions tab)
3. Choose **JSON** and paste the policy from the [IAM Instance Profile Policy](#iam-instance-profile-policy) section
4. Review and create the policy

### Step 2: Create Instance Profile and Associate Role

The instance profile connects the IAM role to your EC2 instance. When created via the console in Step 3, the instance profile is created automatically. If creating separately:

1. Navigate to **IAM Dashboard** → **Instance Profiles**
2. Click **Create instance profile**
3. Name: `RDSIAMAuthProfile`
4. Click **Create**
5. Open the instance profile and click **Add roles**
6. Select `RDSIAMAuthRole`

### Step 3: Launch EC2 Instance

1. Navigate to **EC2 Dashboard** → **Instances**
2. Click **Launch Instances**

**Name and Tags:**
- Name: `RDS-IAM-App`

**Application and OS Images:**
- Select: **Ubuntu**
- Version: **Ubuntu Server 24.04 LTS**

**Instance Type:**
- Select: `t3.micro` (eligible for free tier)

**Key Pair:**
- Select: "Proceed without a key pair" (We use Session Manager)

**Network Settings:**
- VPC: Select the VPC created earlier
- Subnet: Select the **public subnet** (`10.0.1.0/24`)
- Auto-assign public IP: **Enable** (instance will be publicly accessible)
- Security group: Select `EC2-SG`

**Advanced Details:**
- IAM Instance Profile: Select `RDSIAMAuthProfile`

3. Click **Launch Instance**
4. Wait for the instance to reach "Running" state (2-3 minutes)

### Step 4: Verify SSM Session Manager Access

1. Navigate to **AWS Systems Manager** → **Session Manager**
2. Click **Start session**
3. Select your EC2 instance (`RDS-IAM-App`)
4. Click **Start session**
5. A terminal should open in your browser

You now have secure shell access to the EC2 instance without needing SSH keys!

### Step 5: Install Docker and Dependencies

Once you have Session Manager access to the EC2 instance:

```bash
# Update system packages
sudo apt-get update
sudo apt-get upgrade -y

# Install Git (to clone the repository)
sudo apt-get install -y git

# Install MySQL client (to test database connectivity)
sudo apt-get install -y mysql-client

# Install Docker using official Docker Engine installation
# Reference: https://docs.docker.com/engine/install/ubuntu/

sudo apt-get install -y ca-certificates curl gnupg lsb-release

# Add Docker's official GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Set up the stable repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Start Docker and enable on boot
sudo systemctl start docker
sudo systemctl enable docker

# Add your user to docker group (optional, to run docker without sudo)
sudo usermod -aG docker $USER
newgrp docker
```

### Step 6: Clone Repository and Build Docker Image

```bash
# Clone your repository
git clone <your-repository-url>
cd <repository-name>

# Or if you want to upload the code directly:
# You can use the Session Manager file upload feature or use git

# Build the Docker image
docker build -t rds-iam-auth:latest .

# Verify the image was built
docker images
```

### Step 7: Run the Docker Container

```bash
# Run the container in detached mode
docker run -d \
  --name rds-app \
  -p 3000:3000 \
  rds-iam-auth:latest

# Check if the container is running
docker ps

# View the container logs (useful for debugging)
docker logs -f rds-app
```

The application will:
1. Automatically retrieve configuration from SSM Parameter Store
2. Use the EC2 instance's IAM role to generate an RDS authentication token
3. Connect to RDS as the `app_user` using the token
4. Start serving HTTP requests on port 3000

### Step 8: Configure Security Group for Application Access

Since the EC2 instance is in the public subnet, you can access the application directly:

1. Navigate to **EC2 Dashboard** → **Security Groups**
2. Select the `EC2-SG` security group
3. Click **Edit inbound rules**
4. Add a rule:
   - Type: Custom TCP
   - Port Range: 3000
   - Source: `0.0.0.0/0` (accessible from anywhere) or your IP address for more security
5. Click **Save rules**
6. Note the EC2 instance's public IP address from the EC2 Dashboard
7. Access the application via: `http://<EC2-Public-IP>:3000`

> **Note**: Since the EC2 instance is in the public subnet with a public IP, you can access the application directly from the internet without needing a load balancer.

### Monitoring and Logs

**View Docker Container Logs:**
```bash
# Follow logs in real-time
docker logs -f rds-app

# View last 100 lines
docker logs --tail 100 rds-app
```

**Test Database Connectivity:**
```bash
# Check if you can reach the RDS instance
mysql -h <your-rds-endpoint> -u app_user --enable-cleartext-plugin
```

**Verify IAM Token Generation:**
The logs will show successful token generation and database connection. Look for messages indicating successful connections.

## IAM Instance Profile Policy

The EC2 instance needs the following IAM permissions:
1. **rds-db:connect** - To generate RDS IAM authentication tokens
2. **ssm:GetParameter** & **ssm:GetParameters** - To retrieve application configuration from Parameter Store
3. **ssmmessages, ec2messages** - For AWS Systems Manager Session Manager (included in managed policy `AmazonSSMManagedInstanceCore`)

### Complete IAM Policy

Attach this inline policy to the `RDSIAMAuthRole`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "RDSIAMAuthentication",
      "Effect": "Allow",
      "Action": [
        "rds-db:connect"
      ],
      "Resource": [
        "arn:aws:rds-db:<region>:<account_id>:dbuser:<DB_ID>/<DB_IAM_AUTH_USER>"
      ]
    },
    {
      "Sid": "RetrieveSSMParameters",
      "Effect": "Allow",
      "Action": [
        "ssm:GetParameter",
        "ssm:GetParameters"
      ],
      "Resource": [
        "arn:aws:ssm:*:<account-id>:parameter/rds-iam-app/*"
      ]
    }
  ]
}
```

### Managed Policy (Automatically Attached)

The `AmazonSSMManagedInstanceCore` managed policy includes:
- `ssmmessages:CreateControlChannel`
- `ssmmessages:CreateDataChannel`
- `ssmmessages:OpenControlChannel`
- `ssmmessages:OpenDataChannel`
- `ec2messages:GetMessages`

These enable AWS Systems Manager Session Manager access.

### Adding the Inline Policy via AWS Management Console

1. Navigate to **IAM Dashboard** → **Roles**
2. Select your `RDSIAMAuthRole`
3. Click **Add inline policy**
4. Choose **JSON**
5. Paste the policy JSON above (remember to replace `<account-id>` with your AWS account ID)
6. Review and click **Create policy**

### Verify Permissions

To verify that the EC2 instance has the correct permissions:

```bash
# From Session Manager terminal on the EC2 instance
# Get the current AWS account ID
aws sts get-caller-identity

# Test access to SSM Parameters
aws ssm get-parameters \
  --names "/demo/rds/endpoint" "/demo/rds/username" \
  --region us-east-1

# Expected output: Should show the parameter values without errors
```

## Testing the Application

### Test 1: Verify Docker Container is Running

From your EC2 instance via Session Manager:

```bash
# List running containers
docker ps

# You should see something like:
# CONTAINER ID   IMAGE                COMMAND                  CREATED       STATUS       PORTS
# abc123def456   rds-iam-auth:latest  "node src/server.js"    2 minutes ago Up 2 minutes 0.0.0.0:3000->3000/tcp

# View container logs
docker logs rds-app

# Follow logs in real-time
docker logs -f rds-app
```

### Test 2: Verify Database Connectivity

From your EC2 instance via Session Manager:

```bash
# Test connection to RDS using the IAM-authenticated database user
mysql -h <your-rds-endpoint> \
  -P 3306 \
  -u app_user \
  --enable-cleartext-plugin

# If connected successfully, you should see the MySQL prompt: mysql>

# Exit MySQL
EXIT;
```

### Test 3: Verify SSM Parameter Store Access

From your EC2 instance via Session Manager:

```bash
# Retrieve one of the parameters the application uses
aws ssm get-parameter \
  --name /demo/rds/endpoint \
  --region us-east-1

# Expected output:
# {
#     "Parameter": {
#         "Name": "/demo/rds/endpoint",
#         "Type": "String",
#         "Value": "rds-iam-mysql.cyucot0xapry.us-east-1.rds.amazonaws.com",
#         "Version": 1
#     }
# }
```

### Test 4: Check Application Logs for Token Generation

The application logs will show successful IAM token generation and database connection:

```bash
# View application logs
docker logs rds-app

# Look for messages indicating:
# - Successful parameter retrieval from SSM
# - Database connection using IAM token
# - No errors or connection failures
```

### Test 5: Monitor with CloudWatch (Optional)

If you enabled CloudWatch Logs during RDS creation:

1. Navigate to **CloudWatch Dashboard** → **Logs** → **Log Groups**
2. Look for log groups related to your RDS instance
3. Check for connection events and any errors

### Test 6: Test Application Endpoint (If Configured)

If you've set up a load balancer or exposed the application:

```bash
# From your local machine
curl http://<load-balancer-dns>:3000

# Or from within the EC2 instance
curl http://localhost:3000
```

## Troubleshooting

### Issue: Container fails to start or exits immediately

**Solution:**
```bash
# Check the container logs for error messages
docker logs rds-app

# Look for errors related to:
# - SSM Parameter retrieval
# - IAM token generation
# - Database connection
```

### Issue: "Unable to retrieve SSM parameters"

**Possible Causes:**
- IAM role missing `ssm:GetParameter` or `ssm:GetParameters` permissions
- Parameter names are incorrect in SSM Parameter Store
- Wrong AWS region specified

**Solution:**
1. Verify the IAM role has the correct SSM permissions
2. Verify parameter names in SSM Parameter Store match the application expectations
3. Verify the EC2 instance has the `RDSIAMAuthProfile` instance profile attached

```bash
# Check attached instance profile
aws ec2 describe-instances --instance-ids i-xxxxx --query 'Reservations[0].Instances[0].IamInstanceProfile'
```

### Issue: "Access denied for user 'app_user'@'%'"

**Possible Causes:**
- IAM database user not created correctly
- IAM role missing `rds-db:connect` permission
- RDS instance doesn't have IAM authentication enabled

**Solution:**
1. Verify the IAM database user exists:
   ```bash
   # Connect as admin and check
   mysql -h <your-rds-endpoint> -u admin -p
   SELECT User, Host, plugin FROM mysql.user WHERE User = 'app_user';
   ```

2. Verify RDS instance has IAM authentication enabled
3. Verify IAM role has `rds-db:connect` permission

### Issue: "Token has expired"

**Note:** This is normal and expected. The application automatically generates a new 15-minute token before expiration. Check logs to ensure token refresh is working.

```bash
# Look for log entries about token generation
docker logs rds-app | grep -i "token\|connection"
```

### Issue: Cannot access EC2 instance via Session Manager

**Possible Causes:**
- IAM role missing `AmazonSSMManagedInstanceCore` policy
- EC2 instance not assigned an instance profile
- NAT Gateway route not configured

**Solution:**
1. Verify the EC2 instance has the instance profile attached
2. Verify the IAM role has the `AmazonSSMManagedInstanceCore` managed policy
3. Verify the private subnet route table has a route to the NAT Gateway

### Issue: "Cannot reach RDS endpoint"

**Possible Causes:**
- Security group rules not configured correctly
- RDS endpoint is incorrect
- Network ACLs blocking traffic

**Solution:**
1. Verify the `RDS-SG` allows inbound traffic on port 3306 from `EC2-SG`
2. Verify the RDS endpoint is correct in SSM Parameter Store
3. Verify network ACLs in your VPC allow MySQL traffic

```bash
# Test connectivity from EC2
telnet <your-rds-endpoint> 3306

# Or using nc (if installed)
nc -zv <your-rds-endpoint> 3306
```

## Documentation References

### AWS IAM Authentication for RDS
- [AWS RDS IAM Database Authentication](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/UsingWithRDS.IAMDBAuth.html) - **Important**: Review limitations and requirements
- [Setting Up IAM Database Authentication](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/UsingWithRDS.IAMDBAuth.Connecting.html)
- [MySQL User Provisioning for IAM](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/UsingWithRDS.IAMDBAuth.DBAccounts.html)
- [RDS MySQL Security](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_Security.html)

### AWS Secrets Manager and RDS
- [AWS Secrets Manager User Guide](https://docs.aws.amazon.com/secretsmanager/)
- [Rotating RDS Database Credentials](https://docs.aws.amazon.com/secretsmanager/latest/userguide/rotating-secrets.html)
- [RDS Integration with Secrets Manager](https://docs.aws.amazon.com/secretsmanager/latest/userguide/manage_stored-secrets.html)

### AWS RDS SSL/TLS
- [RDS SSL/TLS Documentation](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/UsingWithRDS.SSL.html)
- [RDS Region Certificates](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/UsingWithRDS.SSL.html#UsingWithRDS.SSL.RegionCertificates)
- [RDS CA Certificate Bundle](https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem)

### AWS Systems Manager
- [AWS Systems Manager Session Manager](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager.html)
- [Parameter Store User Guide](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html)
- [Getting Started with Parameter Store](https://docs.aws.amazon.com/systems-manager/latest/userguide/parameter-store-getting-started.html)

### AWS IAM and EC2
- [IAM Roles for EC2](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/iam-roles-for-amazon-ec2.html)
- [EC2 Instance Profiles](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_use_switch-role-ec2_instance-profiles.html)
- [IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)

### Networking and VPC
- [AWS VPC User Guide](https://docs.aws.amazon.com/vpc/)
- [Creating Subnets in VPC](https://docs.aws.amazon.com/vpc/latest/userguide/working-with-vpcs.html#AddaSubnet)
- [NAT Gateways](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-nat-gateway.html)
- [Security Groups](https://docs.aws.amazon.com/vpc/latest/userguide/VPC_SecurityGroups.html)

### Docker and Container Deployment
- [Docker Official Documentation](https://docs.docker.com/)
- [Docker Engine Installation - Ubuntu](https://docs.docker.com/engine/install/ubuntu/) - Referenced in Step 5 of EC2 Deployment
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Docker Container Lifecycle](https://docs.docker.com/engine/reference/commandline/container/)

### Node.js Database Drivers
- [MySQL2/Promise Documentation](https://github.com/sidorares/node-mysql2)
- [Node.js AWS SDK Documentation](https://docs.aws.amazon.com/sdk-for-javascript/)
- [Node.js Best Practices for AWS](https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/)

### Security and Compliance
- [AWS Well-Architected Framework - Security Pillar](https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/welcome.html)
- [CloudTrail Logging](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/)
- [AWS Security Best Practices](https://aws.amazon.com/architecture/security-identity-compliance/)
- [Principle of Least Privilege with IAM](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html#grant-least-privilege)

### Additional Resources

**Configuration Management:**
- [AWS Systems Manager Parameter Store Best Practices](https://docs.aws.amazon.com/systems-manager/latest/userguide/parameter-store-best-practices.html)
- [Secrets Management: Secrets Manager vs Parameter Store](https://docs.aws.amazon.com/secretsmanager/latest/userguide/intro.html)

**Monitoring and Observability:**
- [CloudWatch Logs](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/)
- [CloudWatch Alarms](https://docs.aws.amazon.com/AmazonCloudWatch/latest/DeveloperGuide/AlarmThatSendsEmail.html)
- [VPC Flow Logs for Network Troubleshooting](https://docs.aws.amazon.com/vpc/latest/userguide/flow-logs.html)

**Database Administration:**
- [MySQL Official Documentation](https://dev.mysql.com/doc/)
- [MySQL User and Privilege Management](https://dev.mysql.com/doc/refman/8.0/en/user-accounts.html)

## Quick Reference Commands

### Docker Commands
```bash
# Build image
docker build -t rds-iam-auth:latest .

# Run container
docker run -d --name rds-app -p 3000:3000 rds-iam-auth:latest

# View logs
docker logs -f rds-app

# Stop container
docker stop rds-app

# Remove container
docker rm rds-app

# Remove image
docker rmi rds-iam-auth:latest
```

### AWS CLI Commands
```bash
# Get SSM parameters
aws ssm get-parameters --names "/demo/rds/endpoint" --region us-east-1

# Get EC2 instance details
aws ec2 describe-instances --instance-ids i-xxxxx

# Get IAM role details
aws iam get-role --role-name RDSIAMAuthRole

# Get RDS instance details
aws rds describe-db-instances --db-instance-identifier rds-iam-mysql
```

### MySQL Commands
```bash
# Connect as IAM user
mysql -h <rds-endpoint> -u app_user --enable-cleartext-plugin

# Connect as admin (if needed)
mysql -h <rds-endpoint> -u admin -p

# Create IAM user
CREATE USER 'app_user'@'%' IDENTIFIED WITH AWSAuthenticationPlugin AS 'RDS';

# List users
SELECT User, Host, plugin FROM mysql.user;

# Grant privileges
GRANT SELECT, INSERT, UPDATE, DELETE ON database_name.* TO 'app_user'@'%';
```

## YouTube Companion Guide

This project includes a comprehensive YouTube tutorial that demonstrates:
- VPC and subnet creation
- Security group configuration
- RDS instance creation with IAM authentication enabled
- EC2 instance setup with Systems Manager access
- Docker installation and container deployment
- Testing and troubleshooting

The video provides visual step-by-step guidance for each section of this README.

## License

This project is provided as-is for educational and testing purposes.
