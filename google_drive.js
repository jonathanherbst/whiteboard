class google_drive
{
    constructor()
    {
        this._loaded = false;
        this._initialized = false;
        this._signed_in = false;
        this._busy = false;
        this._action_queue = [];
    }

    async *files(name)
    {
        let response = null;
        do
        {
            const page_token = response ? response.pageToken : null;
            response = await this._list_files(name, page_token);
            console.log(response);
            for(const f of response.result.files)
                yield f;
        } while(response && response.pageToken);
    }

    async _list_files(name, page_token)
    {
        let self = this;
        return await new Promise(function(resolve, reject) {
            const action = async function() {
                const query = (name ? "name contains '" + name + "' and " : "") + "mimeType='application/whiteboard'";

                gapi.client.drive.files.list({
                    q: query,
                    fields: 'nextPageToken, files(id, name)',
                    spaces: 'drive',
                    pageToken: page_token,
                }).then(function(result) {
                    resolve(result);
                }, function(error) {
                    reject(error);
                });
            };

            self._execute(action, reject);
        })
        
    }

    async _execute(action, reject)
    {
        if(!this._signed_in)
        {
            this._action_queue.push({action: action, reject: reject});
            if(!this._busy)
                await this._open();
        }
        else
        {
            await action();
        }
    }

    async _open()
    {
        this._busy = true;
        try
        {
            if(!this._loaded)
            {
                await this._load();
                this._loaded = true;
            }

            if(!this._initialized)
            {
                await this._initialize();
                this._initialized = true;
            }

            if(!this._signed_in)
            {
                await this._sign_in();
                this._signed_in = true;
            }

            for(const action of this._action_queue)
            {
                await action.action();
            }
            this._action_queue = [];
        }
        catch(error)
        {
            this._action_queue.map(function(value) {
                value.reject(error);
            });
            this._action_queue = [];
            throw error;
        }
        finally
        {
            this._busy = false;
        }
    }

    async _load()
    {
        this._drive = null;
        let promise = new Promise(function(resolve, reject) {
            let script = document.createElement('script');
            script.src = "https://apis.google.com/js/api.js";
            script.addEventListener("load", function(event) {
                console.log("gapi loaded")
                console.log(gapi)
                gapi.load('client:auth2', {
                        callback: function(){
                            console.log("gapi auth2 loaded");
                            resolve();
                        },
                        onerror: function() {
                            console.log("gapi auth2 load error");
                            reject(Error("Failed loading google api."));
                        }
                });
            }, false);
            script.addEventListener("error", function(event) {
                reject(Error("Failed to retrieve google api."));
            }, false);
            document.body.append(script);
        });
        return await promise;
    }

    async _initialize()
    {
        return await new Promise(function(resolve, reject) {
            gapi.client.init({
                apiKey: config.gapi.key,
                clientId: config.gapi.client_id,
                discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
                scope: 'https://www.googleapis.com/auth/drive.metadata.readonly',
            }).then(function() {
                resolve();
            }, function(error) {
                reject(error);
            });
        });
    }

    async _sign_in()
    {
        return await new Promise(function(resolve, reject){
            gapi.auth2.getAuthInstance().signIn().then(function() {
                resolve()
            }, function(error) {
                reject(error);
            });
        });
    }
}