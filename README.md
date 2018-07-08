# kube-mail -- SMTP server for Kubernetes

**Caution** This is entirely experimental and may eat your cluster.

kube-mail is a policy-based SMTP server designed for running in a Kubernetes cluster.

## Deployment

```
$ git clone https://github.com/martin-helmich/kube-mail
$ cd kube-mail
$ helm upgrade -i kubemail ./chart
```

## Usage (PHP example)

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
