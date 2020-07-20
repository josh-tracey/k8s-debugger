# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Todo

- Config loading, with multiple file specified in environment needs fixing.
- Context switching needs proper error handling.
- cluster certificates / current context in kube config needs to be updated in cache on context switching.

## [0.7.0] - 2020-07-19

### Added 

- Live streaming of logs, with pod group tags for log groups.

### Changed

- Context switching now loads correctly, little hacky but works.

## [0.6.0] - 2020-07-17

### Changed
- Deployment scaling now done to spec of kubernetes client repo
- Removed useless fields in pod status command.

## [0.5.0] - 2020-05-20

### Added

- Log merger, gives ability to select any number of avaliable pods and retrieve the logs and merge into grouped by time series.
- Pod Status, displays table with all the pods in current namespace.
- Delete multiple pods, deployments, services, secrets.
- Change currrent namspace.
- Change current context.

### Experimental

- Live Reload, allows deployments to be live reloaded in production evnironments without interruptions to the users.
