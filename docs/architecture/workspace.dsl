workspace "RescueLink Taguig" "Emergency response, incident logging, and civilian coordination platform for Taguig City." {
    
    model {
        # Actors
        resident = person "Resident" "A civilian in Taguig City who reports incidents or asks for emergency assistance." "Person"
        agency = person "Emergency Agency" "Police, Fire, Medical, or DRRMO personnel coordinating on-ground response." "Person"
        commandCenter = person "Command Center Admin" "Administrator overseeing the platform, resources, and live operations." "Person"
        
        # Core System
        rescueLink = softwareSystem "RescueLink System" "Provides real-time incident mapping, weather monitoring, and WebSocket-based coordination." "Brand" {
            webApp = container "Web Application" "Delivers the responsive user interface for residents, agencies, and command center." "Next.js, React, Tailwind CSS" "WebBrowser"
            api = container "Backend API" "Handles business logic, real-time messaging, auth, and database access." "NestJS, TypeScript" "Backend"
            database = container "Database" "Stores user profiles, incidents, logs, shadow bans, and resources." "PostgreSQL" "Database"
            storage = container "File Storage" "Stores images, avatars, and file attachments." "AWS S3" "BlobStorage"
            
            # Relationships inside System
            resident -> webApp "Reports incidents, requests help, and views updates using"
            agency -> webApp "Coordinates response, chats, and views live map using"
            commandCenter -> webApp "Manages system, verifies users, and views analytics using"
            
            webApp -> api "Makes API calls and WebSocket connections to" "JSON/HTTPS/WSS"
            api -> database "Reads from and writes to" "Prisma/TCP"
            api -> storage "Uploads and retrieves files from" "AWS SDK/HTTPS"
        }
        
        # External Systems
        weatherAPI = softwareSystem "Weather Data Provider" "External system for weather and flood risk data (e.g., Open-Meteo)." "External"
        api -> weatherAPI "Fetches real-time weather and coordinate data from" "HTTPS"
        
        # Development Environment
        development = deploymentEnvironment "Development" {
            deploymentNode "Developer Workstation" "Windows / macOS / Linux" "Developer Machine" {
                deploymentNode "Node.js Environment" "Runs the Next.js frontend locally" "Node.js" {
                    devWebAppInstance = containerInstance webApp
                }
                deploymentNode "Docker Compose" "Local container orchestration and networking" "Docker Engine" {
                    devApiInstance = containerInstance api
                    devDatabaseInstance = containerInstance database
                }
            }
        }
        
        # Production Environment
        production = deploymentEnvironment "Production" {
            deploymentNode "Hostinger" "DNS & Custom Domain Management" "DNS Provider" {
                deploymentNode "Vercel" "Edge Network & Serverless Hosting" "Vercel Platform" {
                    prodWebAppInstance = containerInstance webApp
                }
            }
            
            deploymentNode "Amazon Web Services (AWS)" "Cloud Infrastructure" "AWS Cloud" {
                alb = infrastructureNode "Application Load Balancer" "Routes external incoming traffic to the backend API containers." "AWS ALB"
                
                deploymentNode "Elastic Container Service" "Serverless Container Execution" "AWS Fargate" {
                    deploymentNode "api-container" "Docker Container pulled from ECR" "Docker" {
                        prodApiInstance = containerInstance api
                    }
                }
                
                deploymentNode "Relational Database Service" "Managed Highly-Available DB inside a secure private subnet" "AWS RDS" {
                    prodDatabaseInstance = containerInstance database
                }
                
                deploymentNode "Simple Storage Service" "Object Storage for media and files" "AWS S3" {
                    prodStorageInstance = containerInstance storage
                }
                
                # Explicit infra routing relationships
                prodWebAppInstance -> alb "Makes API calls and WSS connections via" "JSON/HTTPS/WSS"
                alb -> prodApiInstance "Forwards traffic to" "HTTPS/WSS"
            }
        }
    }
    
    views {
        systemContext rescueLink "SystemContext" {
            include *
            autoLayout tb
            description "System context diagram for RescueLink Taguig showing key actors and external integrations."
        }
        
        container rescueLink "Containers" {
            include *
            autoLayout tb
            description "Container diagram showing the high-level architecture of RescueLink Taguig."
        }
        
        deployment rescueLink "Development" "DevelopmentDeployment" {
            include *
            # Explicitly include the persons to ensure consistency across views
            include resident agency commandCenter weatherAPI
            autoLayout tb
            description "Development deployment diagram showing Docker and local Node.js integration."
        }
        
        deployment rescueLink "Production" "ProductionDeployment" {
            include *
            # Explicitly include the persons to ensure consistency across views
            include resident agency commandCenter weatherAPI
            autoLayout tb
            description "Production deployment diagram showing AWS ECS, RDS, S3, ALB, and Vercel edge deployment."
        }
        
        theme default
        
        styles {
            element "Brand" {
                background #dc2626
                color #ffffff
            }
            element "Person" {
                shape Person
                background #b91c1c
                color #ffffff
            }
            element "WebBrowser" {
                shape WebBrowser
                background #dc2626
                color #ffffff
            }
            element "Backend" {
                shape RoundedBox
                background #dc2626
                color #ffffff
            }
            element "Database" {
                shape Cylinder
                background #b91c1c
                color #ffffff
            }
            element "BlobStorage" {
                shape Folder
                background #b91c1c
                color #ffffff
            }
            element "External" {
                background #6b7280
                color #ffffff
            }
            element "InfrastructureNode" {
                shape RoundedBox
                background #4b5563
                color #ffffff
            }
        }
    }
}
