const blogModel = require("../models/blogModel");
const authorModel = require("../models/authorModel");
const mongoose = require('mongoose')

//---------------------------------------- Hoisting ----------------------------------
const isValid = function (value) {
    if (typeof value === 'undefined' || value === null) return false        //object id
    if (typeof value === 'string' && value.trim().length === 0) return false        //string
    return true
}


const isValidObjectId = function (value) {            //for validating object id
    return mongoose.Types.ObjectId.isValid(value) //returns boolean values
}


const isValidRequestBody = (blog) => {
    return Object.keys(blog).length > 0
}


// --------------------------------------- POST /blogs --------------------------------------

const createBlog = async function (req, res) {
    try {
        let blog = req.body

        const { title, body, authorId, category } = blog


        const authorIdFromToken = req.loggedInAuthorId
        if (!isValidObjectId(authorIdFromToken)) {
            res.status(400).send({ status: false, message: `${authorIdFromToken} is Not a Valid token id` })
            return
        }

        // Validating blogData 
        if (!isValidRequestBody(blog)) {
            return res.status(400).send({ status: false, message: "please provide Blog details" })

        }


        if (!isValid(title)) {
            return res.status(400).send({ status: false, message: 'Blog Title Is Required' })

        }

        if (!isValid(body)) {
            return res.status(400).send({ status: false, message: 'Body Is Required' })

        }

        if (!isValid(authorId)) {
            return res.status(400).send({ status: false, message: 'Author Id Is Required' })

        }

        if (!isValidObjectId(authorId)) {
            return res.status(400).send({ status: false, message: `${authorId} is Not a Valid authorId` })

        }


        if (!isValid(category)) {
            return res.status(400).send({ Status: false, message: 'Blog Category Is Required' })

        }
        if (authorId != authorIdFromToken) {
            res.status(401).send({ status: false, message: 'Unauthrized Access' })
            return
        }


        let author = await authorModel.findById(authorId)

        if (!author) {
            return res.status(404).send({ msg: "Author Not Found" })
        }

        let blogCreated = await blogModel.create(blog)
        if (!blogCreated) {
            return res.status(400).send({ Status: false, msg: "Invalid Request" })
        }

        return res.status(201).send({ status: true, message: "Blog Created Successfully", data: blogCreated })

    } catch (error) {
        res.status(500).send({ status: false, Error: error.message })
    }
}

// --------------------------------------- GET /blogs --------------------------------------

const getBlog = async function (req, res) {

    try {
        
        const data = req.query
        const filterQuery = { isDeleted: false,isPublished: true }

        if (Object.keys(data) == 0) {

            let blog = await blogModel.find(filterQuery)
            if (blog.length == 0) return res.status(404).send({ status: false, msg: "No Blog Found!!! or it may be deleted " })
            return res.status(200).send({ status: true, msg: blog })
          } 
        

        const { authorId, category, tags, subcategory } = data

        if (isValid(authorId) && isValidObjectId(authorId)) {
            filterQuery['authorId'] = authorId
        }
    
        if (isValid(category)) {
            filterQuery['category'] = category
        }

        if (isValid(tags)) {
            filterQuery['tags'] = tags

        }


        if (isValid(subcategory)) {
            filterQuery['subcategory'] = subcategory
        }

        console.log(filterQuery)

        //Validating data is empty or not

        const getBlog = await blogModel.find(filterQuery)
        console.log(getBlog)
        
        if (getBlog.length===0) {
            return res.status(404).send({ status: false, msg: "No such blog exist" })
        }
        return res.status(200).send({ status: true, data: getBlog })


    } catch (error) {
        res.status(500).send({ status: false, Error: error.message })
    }
}

// --------------------------------------- PUT /blogs/:blogId --------------------------------------

const updateBlog = async function (req, res) {
    try {

        const blogId = req.params.blogId;
        const blogData = req.body

        if (Object.keys(blogData).length == 0)
            return res.status(404).send({ status: false, msg: "Body is required" });
            
      
        let blog = await blogModel.findOneAndUpdate({ _id: blogId, isDeleted: false },
            {
                $set: { isPublished: true, body: blogData.body, title: blogData.title, publishedAt: new Date() },
                $push: { tags: blogData.tags, subcategory: blogData.subcategory }
            },
            { new: true });

        return res.status(200).send({ status: true, data: blog });
    } catch (error) {
        console.log(error)
        return res.status(500).send({ status: false, Error: error.message })
    }

}

// --------------------------------------- DELETE /blogs/:blogId --------------------------------------

const deleteBlog = async function (req, res) {
    try {
        let blogId = req.params.blogId
        let blog = await blogModel.findById(blogId)
        if (blog.isDeleted === true) {
            return res.status(404).send({ status: false, message: "No such blogId exists" })
        }
        //.send({status: true, msg: deletedBlog})
        let deletedBlog = await blogModel.findOneAndUpdate({ _id: blogId }, { isDeleted: true, deletedAt: new Date() }, { new: true })
        res.status(200).send({ status: true, data: deletedBlog })
    } catch (error) {
        res.status(500).send({ status: false, Error: error.message })
    }
}

// --------------------------------------- DELETE /blogs?QueryParam -----------------------------------

const deleteQueryParams = async function (req, res) {
    try {
        const data = req.query
        const filterQuery = { isDeleted: false, deletedAt: null } // base condtion
        //console.log(data)

        if (Object.keys(data).length == 0) {
            return res.status(404).send({ status: false, msg: "No such Blog Exist, Please provide filters" })
        }

        let { authorId, category, subcategory, tags, isPublished } = data             // destructuring data
        if (isValid(authorId) && isValidObjectId(authorId)) {                     // use for validating, base => new keys and values are assigned
            filterQuery["authorId"] = authorId
        }
        if (isValid(category)) {
            filterQuery["category"] = category
        }
        if (isValid(subcategory)) {
            filterQuery["subcategory"] = subcategory
        }
        if (isValid(tags)) {
            filterQuery["tags"] = tags
        }
        if (isValid(isPublished)) {
            filterQuery["isPublished"] = isPublished
        }

        //console.log(filterQuery)


        const deletedBlogs = await blogModel.find(filterQuery)
        console.log(deletedBlogs)
        if (deletedBlogs.length === 0) {
            return res.status(404).send({ status: false, error: "Blog is empty" })
        }
        const blogAuth = deletedBlogs.filter((blog) => {                         // authorisation using filter
            if (blog.authorId == req.loggedInAuthorId)
                return blog._id
            else
                return res.status(404).send({ status: false, msg: "User is not authorised to do changes" })
        })


        const deletedBlogs1 = await blogModel.updateMany({ _id: { $in: deletedBlogs } }, { $set: { isDeleted: true, deletedAt: new Date() } })

        // console.log(deletedBlogs1)


        return res.status(201).send({ status: true, msg: "Blogs Deleted Successfully" })

    }

    catch (err) {
        res.status(500).send({ status: false, msg: err.message });
    }
}

//-------------------------------- exporting Modules --------------------------------------------- 

module.exports.createBlog = createBlog;
module.exports.getBlog = getBlog
module.exports.updateBlog = updateBlog
module.exports.deleteBlog = deleteBlog
module.exports.deleteQueryParams = deleteQueryParams 