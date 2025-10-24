//apollo-upload-client.d.ts

declare module 'apollo-upload-client/createUploadLink.mjs' {
    import { HttpOptions } from '@apollo/client/link/http';
    import { ApolloLink } from '@apollo/client';
  
    export default function createUploadLink(options: HttpOptions): ApolloLink;
  }