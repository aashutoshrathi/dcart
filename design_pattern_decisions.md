# Design Pattern Decisions

## Access Control

- Only the owner of contract can delete users.
- Only the owner of contract can delete stores.
- Owner of the contract can freeze the contract in case something goes wrong.
- Owner of the contract has access to delete the contract from the blockchain.
- Owner of the contract can withdraw all the funds, in case of emegency.

## Withdrawl pattern

It prevents store from re-entrancy and DoS attacks.

## Events and Loggging

Every time a user is created or updated or deleted or a donation is made and event is fired which can be caught at the frontend to make it more interactive and improve the UX.

## Circuit Breaker Approach

In case of any kind of error in services, fixing bugs, the owner can freeze the contract hence stopping all kind of transactions.

## Fail early and fail loud

There are no silent errors in the contract and all the require statements are passed an error message so we can know precisely where and why the function execution stopped, functions return a bool status using which we can know whether the function executed properly or not.

Except: https://twitter.com/AashutoshRathi/status/1089618835190104064?s=20

## Factory Contract

There were not much of use case in mine one, unless I had created different contracts for Item and Stores

## Name Registry

Name Registry is used for mapping stores to their owner's accounts.
