{{- define "sklein-bibliography-corpus-rag-manager.labels" -}}
app.kubernetes.io/name: sklein-bibliography-corpus-rag-manager
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

