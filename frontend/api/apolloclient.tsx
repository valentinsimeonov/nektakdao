// apolloclient.ts

import { ApolloClient, InMemoryCache, ApolloLink, split } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { onError } from '@apollo/client/link/error';
import createUploadLink from "apollo-upload-client/createUploadLink.mjs";
import { getMainDefinition } from '@apollo/client/utilities';

import { ValueNode } from 'graphql';



// Auth link
const authLink = new ApolloLink((operation, forward) => {
  return forward(operation);
});

// WebSocket link for subscriptions
const wsLink = new GraphQLWsLink(
  createClient({
    url: 'ws://localhost:8080/graphql',
    connectionParams: () => {
      // No token required since the session cookie will be handled by the server
      return { headers: {} };
    },
  })
);

// Upload link for HTTP operations (queries and mutations)
const uploadLink = createUploadLink({
  uri: 'http://localhost:8080/graphql',
  headers: {
    'apollo-require-preflight': 'true',
  },
  credentials: 'include', // Include cookies with every request
});

// Error handling link
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.map(({ message, locations, path }) => {
      console.log(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      );
    });
  }
  if (networkError) {
    console.log(`[Network error]: ${networkError}`);
  }
});

// Link split based on operation type (HTTP vs WebSocket)
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  ApolloLink.from([errorLink, authLink, uploadLink])
);


const typePolicies = {
  Date: {
    __serialize(value: Date | number) {
      return typeof value === 'number' ? value : value.getTime(); // Handle both Date object and number
    },
    __parseValue(value: number | string) {
      if (typeof value === 'number') return new Date(value); // Unix timestamp to Date
      if (typeof value === 'string') return new Date(value); // ISO string to Date
      return null;
    },
    __parseLiteral(ast: ValueNode) {
      if (ast.kind === 'IntValue') {
        return new Date(parseInt(ast.value, 10)); // Parse Unix timestamp to Date
      }
      if (ast.kind === 'StringValue') {
        return new Date(ast.value); // Parse ISO string to Date
      }
      return null;
    },
  },
};

// Apollo client setup
const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          getMessages: {
            merge(existing, incoming) {
              return incoming;
            },
          },
        },
      },
    },
  }),
});


export default client;




  ///////////////  This was working           ///////////////////////
// Apollo client setup
// const client = new ApolloClient({
//   link: splitLink,
//   cache: new InMemoryCache({
//     typePolicies: {
//       Query: {
//         fields: {
//           getMessages: {
//             merge(existing, incoming) {
//               return incoming;
//             },
//           },
//         },
//       },
//     },
//   }),
// });










// //apolloclient.ts
// import { ApolloClient, InMemoryCache, HttpLink, split } from '@apollo/client';
// import { getMainDefinition } from '@apollo/client/utilities';
// import { WebSocketLink } from '@apollo/client/link/ws';
// //   NEW Using graphql-ws
// import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
// import { createClient } from 'graphql-ws';


// /*      OLD DEVELOPMENT VERSION             */
// /*==========================================*/


// const httpLink = new HttpLink({
// 	uri: 'http://localhost:8080/graphql',
//   });


// const wsLink = new GraphQLWsLink(createClient({
//   url: 'ws://localhost:8080/graphql',
// }));

// const link = split(
//   ({ query }) => {
//     const definition = getMainDefinition(query);
//     return (
//       definition.kind === 'OperationDefinition' &&
//       definition.operation === 'subscription'
//     );
//   },
//   wsLink,
//   httpLink
// );

// const client = new ApolloClient({
//   link,
//   cache: new InMemoryCache(),
// });

// export default client;


// //////////////////    DO NOT DELETE  ---- THE PROD Version STILL USES subscriptions-transport-ws
// /// OLD USIGN subscriptions-transport-ws
// // const wsLink = new WebSocketLink({
// //   uri: 'ws://localhost:8080/graphql',
// //   options: {
// //     reconnect: true,
// //   },
// // });



// /*==========================================*/






