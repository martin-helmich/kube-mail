# kube-mail -- SMTP server for Kubernetes

[![Build Status](https://travis-ci.org/martin-helmich/kube-mail.svg?branch=master)](https://travis-ci.org/martin-helmich/kube-mail)
[![Docker Repository on Quay](https://quay.io/repository/martinhelmich/kube-mail/status "Docker Repository on Quay")](https://quay.io/repository/martinhelmich/kube-mail)

<hr>

**:warning: CAUTION** This is entirely experimental and may eat your cluster.

<hr>

kube-mail is a policy-based SMTP server designed for running in a Kubernetes cluster. It is configurable using Kubernetes Custom Resources and allows you to define policies for outgoing emails based on Pod labels (much like [NetworkPolicies](https://kubernetes.io/docs/concepts/services-networking/network-policies/)).

## Table of Contents

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Getting started](#getting-started)
  - [Installation via Helm](#installation-via-helm)
  - [Configuration](#configuration)
- [Custom Resources](#custom-resources)
  - [`SMTPServer` resources](#smtpserver-resources)
  - [`EmailPolicy` resources](#emailpolicy-resources)
- [APIs](#apis)
- [Sending mails from within a Pod](#sending-mails-from-within-a-pod)
  - [PHP and ssmtp](#php-and-ssmtp)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->


## Getting started

### Installation via Helm

```
$ git clone https://github.com/martin-helmich/kube-mail
$ cd kube-mail
$ helm upgrade -i kubemail ./chart
```

### Configuration

tbw.

## Custom Resources

This controller adds two Custom Resources to your Kubernetes cluster: A `SMTPServer` and a `EmailPolicy` resource, both from the `kube-mail.helmich.me/v1alpha1` API group.

### `SMTPServer` resources

An `SMTPServer` resource describes an SMTP server that should be used for outgoing mails. It is defined like follows:

```yaml
apiVersion: kube-mail.helmich.me/v1alpha1
kind: SMTPServer
metadata:
  name: default
spec:
  server: smtp.yourserver.example
  port: 465
  tls: true
  authType: PLAIN
```

### `EmailPolicy` resources

An `EmailPolicy` defines what kube-mail should do with mails received from a certain pod. An email policy may be configured to do one of two things:

- forward the received email to one of the SMTP servers configured using the `SMTPServer` resources
- store the email in its internal database for later retrieval (useful for development environments that should _not_ actually send emails out into the world).

A forwarding email policy is defined like follows:

```yaml
apiVersion: kube-mail.helmich.me/v1alpha1
kind: EmailPolicy
metadata:
  name: my-policy
spec:
  podSelector:
    matchLabels:
      app.kubernetes.io/name: my-name
  ratelimiting:
    maximum: 100
    period: hour
  sink:
    smtp:
      server:
        name: default
        namespace: default
      credentials:
        name: default-credentials
        namespace: default
``` 

Concerning the individual properties:

<dl>
  <dt><code>.spec.podSelector</code></dt>
  <dd>This is a selector for the Pods this EmailPolicy should apply to. When a SMTP connection is opened to kube-mail, it will identity the source Pod by its Pod IP address and then test if the source Pod matches this label selector.</dd>
  <dt><code>.spec.ratelimiting</code></dt>
  <dd>Rate limiting may be configured per Policy. Allowed periods are <code>"hour"</code> and <code>"minute"</code>. Messages are counted <em>per policy</em>, not per Pod.</dd>
  <dt><code>.spec.sink</code></dt>
  <dd>
    <code>sink</code> describes where kube-mail should deliver received emails. This may either be an SMTP server (described by a <code>SMTPServer</code> resource) or kube-mail's internal database.
    <dl>
      <dt><code>.spec.sink.smtp.server</code></dt>
      <dd><code>server</code> is a reference to a <code>SMTPServer</code> resource. It may be placed in a different namespace.</dd>
      <dt><code>.spec.sink.smtp.credentials</code></dt>
      <dd><code>credentials</code> is a reference to a <code>Secret</code> resource with a <code>"username"</code> and <code>"password"</code> key. It may be placed in a different namespace. <b>NOTE</b>: This is a required value! Unauthenticated SMTP is not supported by kube-mail on principle.</dd>
    </dl>
  </dd>
</dl>

## APIs

As noted, kube-mail may be configured to NOT forward received emails, but to store them in its internal database instead. This is useful for development environments that should not be allowed to send emails out into the world.

To interact with these intercepted emails, kube-mail offers a gRPC API to retrieve them. This gRPC service is described in [`./proto/service.proto`](./proto/service.proto). Use one of the [gRPC client libraries](https://grpc.io/docs/languages/) to build your own client.

## Sending mails from within a Pod

### PHP and ssmtp

Provide `ssmtp` in your Pod; use the following configuration (`/etc/ssmtp/ssmtp.conf`):

```
mailhub=kubemail.default.svc.cluster.local
hostname=foo
FromLineOverride=yes
```

Then in the php.ini:

```
sendmail_path = /usr/sbin/ssmtp -t
```
