package node;

import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import content.Content;
import node.visitor.NodeVisitor;


public class DocumentNode implements Node {

	private Collection<Node> children;
	private Content<?> content;
    private Node parent;
	
	private DocumentNode(Content<?> content, Node parent) {
		this.content = content;
		this.parent = parent;
		this.children = List.of(RootNode.getInstance());
	}

	@Override
	public Collection<Node> children() {
		return this.children;
	}

	@Override
	public Content<?> content() {
		return this.content;
	}
	

	@Override
	public Node parent() {
		return this.parent;
	}
	
	@Override
	public void addChild(Node newChild) {
		this.children = Stream.concat(children.stream(), Stream.of(newChild))
				.distinct()
				.dropWhile(i -> i.equals(RootNode.getInstance())) 
				.collect(Collectors.toList());
		
	}

	@Override
	public <T> T accept(NodeVisitor<T> nodeVisitor) {
		return nodeVisitor.visitDocumentNode(this);
	}
	
	public static class builder extends Node.builder<DocumentNode>{
		
		private Content<?> content;
		private Node parent = RootNode.getInstance();
		
		public builder withContent(Content<?> content) {
			this.content = content;
			return this;
		}
		
		public builder withParent(Node parent) {
			this.parent = parent;
			return this;
		}
		
		
		@Override
		public DocumentNode build() {
			DocumentNode newNode = new DocumentNode(content, parent);
			parent.addChild(newNode);
			this.content = null;
			this.parent = RootNode.getInstance();
			return newNode;
			
		}
		
		public static builder get() {
			return new builder();
		}
		
	}
}
