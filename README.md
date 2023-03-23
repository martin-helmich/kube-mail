# kube-mail -- SMTP server for Kubernetes

[![Build Status](https://travis-ci.org/martin-helmich/kube-mail.svg?branch=master)](https://travis-ci.org/martin-helmich/kube-mail)
[![Docker Repository on Quay](https://quay.io/repository/martinhelmich/kube-mail/status "Docker Repository on Quay")](https://quay.io/repository/martinhelmich/kube-mail)
[![Dependabot Status](https://api.dependabot.com/badges/status?host=github&repo=martin-helmich/kube-mail)](https://dependabot.com)

<hr>

**:warning: CAUTION** This is entirely experimental and may eat your cluster.

<hr>

kube-mail is a policy-based SMTP server designed for running in a Kubernetes cluster. It is configurable using Kubernetes Custom Resources and allows you to define policies for outgoing emails based on Pod labels (much like [NetworkPolicies](https://kubernetes.io/docs/concepts/services-networking/network-policies/)).

## Table of Contents

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Installation](#installation)
- [Basic architecture](#basic-architecture)
- [Custom Resources](#custom-resources)
  - [`SMTPServer` resources](#smtpserver-resources)
  - [`EmailPolicy` resources](#emailpolicy-resources)
- [How-Tos](#how-tos)
  - [Forward all emails from a Pod into a mail catcher](#forward-all-emails-from-a-pod-into-a-mail-catcher)
- [Sending mails from within a Pod](#sending-mails-from-within-a-pod)
  - [PHP and ssmtp](#php-and-ssmtp)
- [Pending features](#pending-features)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## License

This project is licensed under the Apache-2.0 license.

Copyright 2023 Martin Helmich, Mittwald CM Service GmbH & Co. KG and [other contributors](https://github.com/martin-helmich/kube-mail/graphs/contributors).

## Installation

The helm chart of this controller can be found under [./deploy/helm-chart/kube-mail](./deploy/helm-chart/kube-mail).

Alternatively, you can use the [Mittwald Kubernetes Helm Charts](https://github.com/mittwald/helm-charts) repository:
```shell script
helm repo add mittwald https://helm.mittwald.de
helm repo update
helm install kube-mail mittwald/kube-mail --namespace kube-system
```

## Basic architecture

When installed, kube-mail acts as an SMTP server that Pods in your cluster can use to send outgoing mails. This server works without any of the typical SMTP authentication mechanisms; instead, the kube-mail SMTP server authenticates a Pod by its IP address and then tries to find a `EmailPolicy` resource that matches the source Pod (by label).

If an `EmailPolicy` has been found for a Pod, kube-mail will forward the email that should be sent to the upstream SMTP server configured in the `EmailPolicy`. If no `EmailPolicy` matches, kube-mail will reject the email.

Within your Pod, simply use `kube-mail.<namespace>.svc` as SMTP server without any authentication. kube-mail will do the rest.

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

Concerning the individual properties:

<dl>
  <dt><code>.spec.server</code></dt>
  <dd>The host name of your upstream SMTP server. This may be either an external service, or a cluster-internal service (for example, specified by its <code>.svc.cluster.local</code> address)</dd>
  <dt><code>.spec.port</code></dt>
  <dd>The port that the upstream SMTP server is listening on. If omitted, 587 is assumed as default.</dd>
  <dt><code>.spec.tls</code></dt>
  <dd>Defines if the upstream server uses TLS.</dd>
  <dt><code>.spec.authType</code></dt>
  <dd>The SMTP authentation type. Supported values are <code>PLAIN</code>, <code>LOGIN</code>, <code>CRAM-MD5</code> and <code>SCRAM-SHA-1</code>.</dd>
</dl>

### `EmailPolicy` resources

An `EmailPolicy` defines what kube-mail should do with mails received from a certain pod. An email policy will forward the received email to one of the SMTP servers configured using the `SMTPServer` resources.

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
      <dd><code>credentials</code> is a reference to a <code>Secret</code> resource with a <code>"username"</code> and <code>"password"</code> key. It may be placed in a different namespace. <b>NOTE</b>: If omitted, kube-mail will attempt an unauthenticated connection to the SMTP server.</dd>
    </dl>
  </dd>
</dl>

## How-Tos

### Forward all emails from a Pod into a mail catcher

Forwarding all outgoing emails into a mail catcher (like [MailHog](https://github.com/mailhog/MailHog)) is a common use case in development environments, where an application should not be allowed to actually send emails out into the world. To configure kube-mail to forward all emails into a mail catcher, proceed as follows.

1. Make sure that kube-mail is up and running in a namespace of your choice (for this example, we'll assume that kube-mail is running in the `kube-system` namespace).

1. Install the mail catcher of your choice. MailHog, for example, has a [Helm chart](https://github.com/codecentric/helm-charts/tree/master/charts/mailhog) that makes it easy to install:

    ```
    $ helm repo add codecentric https://codecentric.github.io/helm-charts
    $ helm install \
        --namespace kube-system \
        --name mailhog \
        codecentric/mailhog
    ```

1. Configure an `SMTPServer` resource pointing to your MailHog service:

    ```yaml
    apiVersion: kube-mail.helmich.me/v1alpha1
    kind: SMTPServer
    metadata:
      name: mailhog
      namespace: kube-system
    spec:
      server: mailhog.kubemail-system.svc.cluster.local
      port: 1025
      tls: false
    ```

1. Configure an `EmailPolicy` to catch emails from a Pod and forward them to the configured `SMTPServer`. The policy resource needs to be in the same namespace as the Pod that's sending mails.

    ```yaml
    apiVersion: kube-mail.helmich.me/v1alpha1
    kind: EmailPolicy
    metadata:
      name: pod-to-mailhog
      namespace: default # needs to be same namespace as Pod
    spec:
      podSelector:
        matchLabels:
          app.kubernetes.io/name: my-name
      sink:
        smtp:
          server: # server may be in a different namespace than policy
            name: mailhog
            namespace: kube-system
    ```

## Sending mails from within a Pod

### PHP and ssmtp

Provide `ssmtp` in your Pod; use the following configuration (`/etc/ssmtp/ssmtp.conf`):

```
mailhub=kube-mail.kube-system.svc.cluster.local
hostname=foo
FromLineOverride=yes
```

Then in the php.ini:

```
sendmail_path = /usr/sbin/ssmtp -t
```

## Pending features

- [ ] Rate limiting
- [ ] TLS for cluster-internal communication
