# Package functions with helm.

## The Function Custom Resource Definition (CRD)
Create a function using `faas-cli`
```
faas-cli new --lang node14 marketing-list 
```

We want to deploy our functions using the OpenFaaS operator and its Function Custom Resource Definition (CRD)
Generating a function CRD from the stack.yml file can be done using the `faas-cli`. 

```
faas-cli generate -f marketing-list.yml > marketing-list-func.yaml
```
We can now deploy our function using this this resource file an `kubectl apply`

There is a detailed write up on how to [manage functions with kubectl](https://www.openfaas.com/blog/manage-functions-with-kubectl/) but in this example we want to take it one step further and create a helm chart for our functions.


## Creating a helm chart
We can create a new helm chart using `helm create`
```
mkdir chart
cd chart
helm create functions
```

Running these commands should give you a folder structure that looks like this. 
```
.
└── functions
    ├── charts
    ├── Chart.yaml
    ├── templates
    │   ├── deployment.yaml
    │   ├── _helpers.tpl
    │   ├── hpa.yaml
    │   ├── ingress.yaml
    │   ├── NOTES.txt
    │   ├── serviceaccount.yaml
    │   ├── service.yaml
    │   └── tests
    │       └── test-connection.yaml
    └── values.yaml
```

We will replace these templates with are own function templates so you can safely remove the contents of the templates folder. If you are new to helm it might be usefull to take a look at the generated templates to get a grasp of how templating works with helm.

We can now move our generated function definitions to `chart/functions/templates` and start editing them.

```
mv marketing-list-func.yaml chart/functions/templates 
```

## Making the image name configurable
Modify the `marketing-list-func.yaml` template. We make the image configurable.

```
---
apiVersion: openfaas.com/v1
kind: Function
metadata:
  name: marketing-list
  namespace: openfaas-fn
spec:
  name: marketing-list
  image: {{ .Values.marketingList.image }}
```

You can now change the image name or tag by setting the desired value in the `values.yaml` file.
```yaml
marketingList:
  image: welteki/marketing-list:0.1.0
```

## Installing the chart
```
helm install functions chart/functions
```

> The function CRD contains deployment configuration for functions but no build instructions. Building functions still has to be done using the faas-cli or another build method. Make sure your function image is available before deploying.

```
NAME: functions
LAST DEPLOYED: Wed May 18 10:55:53 2022
NAMESPACE: default
STATUS: deployed
REVISION: 1
TEST SUITE: None
```

## Deploying a new versions of a function
Update the version tag in the stack file of the marketing-list function.
```
functions:
  markating-list:
    lang: node14
    handler: ./marketing-list
    image: welteki/marketing-list:0.1.1
```

Build and push the function.
```
faas-cli publish -f marketing-list.yml
```

We can now upgrade the deployment to use the new image
```
helm upgrade functions  chart/functions --set marketingList.image=welteki/marketing-list:0.1.1
```
```
Release "functions" has been upgraded. Happy Helming!
NAME: functions
LAST DEPLOYED: Wed May 18 11:17:28 2022
NAMESPACE: default
STATUS: deployed
REVISION: 2
TEST SUITE: None
```

We can verify that our function is now using the updated image by running `kubectl describe`
```
kubectl describe function/marketing-list -n openfaas-fn | grep "Image"
Image:  welteki/marketing-list:0.1.1
```

## Why would you create a helm chart for functions

- For use with CD tools like Argo and Flux.

    You can have a repo containing the source code and build configuration for functions. Every time a function is updated it is rebuild and published to an image registry. A tool like the [Argo CD Image Updater](https://argocd-image-updater.readthedocs.io/en/v0.1.0/) can check for new version of the container images used by functions and automatically update them to the latest version.
