import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";


import { 
    APIGatewayProxyEvent, 
    APIGatewayProxyResult 
  } from "aws-lambda";

  type LambdaConfig = {
    AWS_ACCESS_KEY_ID: string;
    AWS_SECRET_ACCESS_KEY: string;
    AWS_BUCKET_NAME: string;
    AWS_REGION?: string;
};

    type LambdaParams = {
        uploadKey: string;
        contentType?: string;
    }

  export const lambdaHandler = async (
    event: APIGatewayProxyEvent
  ): Promise<APIGatewayProxyResult> => {

    const params = event.queryStringParameters;
    const {uploadKey, contentType} = params as LambdaParams;

    if (!uploadKey){
        return {
            statusCode: 400,
            body: `Error - uploadKey is required.`
        }
    }

    const {
        AWS_ACCESS_KEY_ID,
        AWS_SECRET_ACCESS_KEY,
        AWS_BUCKET_NAME,
        AWS_REGION
    } = process.env as unknown as LambdaConfig;

    const s3 = new S3Client({
        region: AWS_REGION ?? "auto",
        credentials: {
            accessKeyId: AWS_ACCESS_KEY_ID,
            secretAccessKey: AWS_SECRET_ACCESS_KEY
        },
    });

    const url = await getSignedUrl(
        s3,
        new PutObjectCommand({
            Bucket: `${AWS_BUCKET_NAME}`,
            Key: `${uploadKey}`,
        }),
        {
            expiresIn: 60 * 60 * 24 * 7, // 7d
        }
    );

    const response = await fetch(url, {
        method: "POST",
        body: event.body,
        headers: {
          "Content-Type": contentType ?? 'application/octet-stream'
        }
      });
    

    return {
      statusCode: 200,
      body: event.body ?? 'Ok.'
    }
  }