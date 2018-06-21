# kube-mail

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
