# UploadThing API

## Overview

UploadThing is a file upload service that allows applications to upload files and access them through generated URLs.

Main use case for this project:
- upload files
- get back file metadata
- return file URLs that can be shared

## Relevant Capabilities

Based on the documentation, UploadThing supports:
- uploading files
- generating file URLs
- returning uploaded file metadata
- server-side API usage with authentication

## Typical Upload Flow

1. Prepare file information
2. Send file through the supported upload flow
3. Receive uploaded file metadata
4. Use returned file URL as a shareable link

## Authentication

UploadThing uses server-side credentials / token-based authentication.

Credentials should be stored securely in environment variables.

## Important Data Returned After Upload

Typical useful response fields:
- file key
- file name
- file size
- file type
- file URL

## Notes

For MCP server generation, the most relevant part of the API is the ability to:
- accept file input
- upload file
- return a shareable URL